/**
 * LSE adapter — real data.
 *
 * Downloads the London Stock Exchange's monthly Main Market equity factsheets
 * and extracts the "New Issues" detail table from each, plus the year-to-date
 * summary figures.
 *
 * Run with: npm run ingest:lse
 *
 * Why this source and not the other one
 * -------------------------------------
 * The obvious candidate is the LSE's "New issues and IPOs" workbook, which is
 * a single machine-readable file covering 1995 onwards. It is not usable as a
 * live feed: it is frozen at 31 December 2020. The monthly factsheets are the
 * current publication and are updated every month.
 *
 * What this data actually is
 * --------------------------
 * Completed admissions to the Main Market, not a forward pipeline. A company
 * appears here on the day it lists, not while it is preparing to. Upcoming
 * listings are announced through RNS (intention to float), which is a separate
 * and much messier source. This adapter is deliberately honest about that
 * rather than presenting admissions as if they were upcoming IPOs.
 *
 * Output is written to src/data/generated/lse-live.json and committed, so the
 * site build never depends on the LSE being reachable.
 */

import ExcelJS from "exceljs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../src/data/generated/lse-live.json");

const BASE = "https://docs.londonstockexchange.com/sites/default/files/reports";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Identify the scraper honestly rather than impersonating a browser. */
const USER_AGENT =
  "ipo-tracker/1.0 (open-source IPO dashboard; contact via repository)";

/** Which factsheets to try. Missing months simply 404 and are skipped. */
const YEARS = [2025, 2026];

async function fetchFactsheet(year, monthName) {
  const url = `${BASE}/Main%20Market%20factsheet%20${monthName}%20${year}.xlsx`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  return { url, buffer };
}

/** Normalise a cell into a string, number, or null. */
function cellValue(cell) {
  if (cell === null || cell === undefined) return null;
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  if (typeof cell === "object") {
    const inner = cell.text ?? cell.result ?? cell.richText;
    if (Array.isArray(inner)) return inner.map((p) => p.text).join("");
    return inner === undefined ? null : inner;
  }
  if (typeof cell === "string") {
    const trimmed = cell.trim();
    // The sheets use "-" for a genuine zero/none.
    if (trimmed === "" || trimmed === "-") return null;
    return trimmed;
  }
  return cell;
}

/**
 * Build a header -> column index map.
 *
 * The factsheets merge cells across columns, so exceljs reports the same
 * header text repeated. Taking the first occurrence of each label gives the
 * real column and ignores the merge artefacts.
 */
function headerMap(row) {
  const map = new Map();
  const values = Array.isArray(row.values) ? row.values : [];
  values.forEach((raw, index) => {
    const label = cellValue(raw);
    if (typeof label === "string" && !map.has(label)) map.set(label, index);
  });
  return map;
}

function findHeaderRow(sheet, marker) {
  for (let r = 1; r <= sheet.rowCount; r++) {
    const values = sheet.getRow(r).values;
    if (!Array.isArray(values)) continue;
    if (values.some((v) => cellValue(v) === marker)) return r;
  }
  return null;
}

function parseNewIssues(sheet, sourceUrl, period) {
  const headerRow = findHeaderRow(sheet, "Admission Date");
  if (headerRow === null) return [];

  const cols = headerMap(sheet.getRow(headerRow));
  const get = (values, label) => {
    const index = cols.get(label);
    return index === undefined ? null : cellValue(values[index]);
  };

  const issues = [];
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const values = sheet.getRow(r).values;
    if (!Array.isArray(values)) continue;

    const admissionDate = get(values, "Admission Date");
    const issuer = get(values, "Issuer Name");
    // The table ends with a "Sum:" row that has no date or issuer.
    if (!admissionDate || !issuer) continue;

    const ipoFlag = get(values, "LSE IPO Y/N");

    issues.push({
      admissionDate: String(admissionDate).slice(0, 10),
      issuerName: String(issuer),
      symbol: get(values, "Symbol"),
      issueType: get(values, "Issue Type"),
      isIpo: typeof ipoFlag === "string" && ipoFlag.toUpperCase().startsWith("Y"),
      icbSector: get(values, "ICB Sector"),
      countryOfIncorporation: get(values, "Country of Inc."),
      marketCapAtAdmission: numberOrNull(
        get(values, "Market Cap at admission (£m)"),
      ),
      moneyRaised: numberOrNull(
        get(values, "Money raised from New shares (£m)"),
      ),
      period,
      sourceUrl,
    });
  }
  return issues;
}

function numberOrNull(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 1000) / 1000;
  }
  return null;
}

/** Year-to-date totals from the Summary sheet's primary market table. */
function parseSummary(sheet) {
  const headerRow = findHeaderRow(sheet, "Year");
  if (headerRow === null) return null;

  // The figures sit two rows below the two-tier header.
  for (let r = headerRow; r <= Math.min(headerRow + 4, sheet.rowCount); r++) {
    const values = sheet.getRow(r).values;
    if (!Array.isArray(values)) continue;
    const numbers = values.map(cellValue).filter((v) => typeof v === "number");
    // Row shape: year, then company counts and values.
    if (numbers.length >= 6 && numbers[0] > 2000 && numbers[0] < 2100) {
      const companiesUk = numbers[1];
      const companiesInternational = numbers[2];
      return {
        year: numbers[0],
        companiesUk,
        companiesInternational,
        // Derived rather than read positionally. Merged cells repeat values
        // across columns, so the nth number in the row is not the nth field --
        // reading the total by position picked up a duplicated figure.
        companiesTotal: companiesUk + companiesInternational,
      };
    }
  }
  return null;
}

/**
 * Collapse multiple instrument lines into one admission per issuer.
 *
 * A company with more than one share class gets a row per instrument -- Young
 * & Co's Brewery lists both its A and non-voting shares on the same day. The
 * LSE's own monthly counts are by issuer, so counting raw rows overstates the
 * total, which is how this was caught.
 *
 * Market cap and money raised are repeated across an issuer's lines rather
 * than split between them, so the maximum is taken. Summing would double-count.
 */
function dedupeByIssuer(rows) {
  const byKey = new Map();

  for (const row of rows) {
    const key = `${row.admissionDate}|${row.issuerName}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, {
        ...row,
        symbols: row.symbol ? [row.symbol] : [],
        instrumentCount: 1,
      });
      continue;
    }

    existing.instrumentCount += 1;
    if (row.symbol && !existing.symbols.includes(row.symbol)) {
      existing.symbols.push(row.symbol);
    }
    existing.marketCapAtAdmission = maxOrNull(
      existing.marketCapAtAdmission,
      row.marketCapAtAdmission,
    );
    existing.moneyRaised = maxOrNull(existing.moneyRaised, row.moneyRaised);
  }

  return [...byKey.values()];
}

function maxOrNull(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

async function main() {
  const files = [];
  const issues = [];
  let summary = null;
  let latestPeriod = null;

  for (const year of YEARS) {
    for (const monthName of MONTHS) {
      const period = `${monthName} ${year}`;
      let result;
      try {
        result = await fetchFactsheet(year, monthName);
      } catch (error) {
        console.warn(`  ! ${period}: ${error.message}`);
        continue;
      }
      if (!result) continue;

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(result.buffer);

      const newIssuesSheet = workbook.getWorksheet("New Issues");
      const monthIssues = newIssuesSheet
        ? parseNewIssues(newIssuesSheet, result.url, period)
        : [];
      issues.push(...monthIssues);

      const summarySheet = workbook.getWorksheet("Summary");
      const monthSummary = summarySheet ? parseSummary(summarySheet) : null;
      if (monthSummary) summary = monthSummary;

      files.push({ period, url: result.url, issueCount: monthIssues.length });
      latestPeriod = period;
      console.log(`  ✓ ${period}: ${monthIssues.length} new issues`);
    }
  }

  if (issues.length === 0) {
    // Never overwrite good data with an empty result. A parse that returns
    // nothing means the format changed, not that the LSE stopped listing.
    throw new Error(
      "No issues parsed from any factsheet — refusing to write an empty dataset.",
    );
  }

  const deduped = dedupeByIssuer(issues);
  deduped.sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));

  const payload = {
    source: "London Stock Exchange — Main Market monthly equity factsheets",
    sourceIndexUrl: "https://www.londonstockexchange.com/reports?tab=main-market",
    fetchedAt: new Date().toISOString(),
    latestPeriod,
    dataDescription:
      "Completed admissions to the LSE Main Market. Not a forward pipeline: companies appear on the day they list.",
    summary,
    files,
    issues: deduped,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const ipos = deduped.filter((i) => i.isIpo).length;
  const collapsed = issues.length - deduped.length;
  console.log(
    `\nWrote ${deduped.length} admissions (${ipos} flagged as IPOs) from ${files.length} factsheets` +
      (collapsed > 0
        ? `, after collapsing ${collapsed} extra instrument line(s)`
        : ""),
  );
  console.log(`-> ${OUT}`);
}

await main();
