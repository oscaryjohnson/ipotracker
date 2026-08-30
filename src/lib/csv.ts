import { EXCHANGES } from "@/data/exchanges";
import { SECTORS } from "@/data/sectors";
import { NA } from "@/lib/format";
import type { IpoRecord } from "@/lib/types";

/** RFC 4180 escaping: wrap in quotes, double any internal quote. */
function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return `"${NA}"`;
  return `"${String(value).replace(/"/g, '""')}"`;
}

const HEADERS = [
  "Company Name",
  "Exchange",
  "Exchange Code",
  "Expected Listing Date",
  "Date Confidence",
  "Sector",
  "Business Description",
  "Expected Valuation (USD)",
  "Expected Valuation (Local)",
  "Local Currency",
  "Status",
  "CEO",
  "CEO Email",
  "CEO Email Confidence",
  "CFO",
  "CFO Email",
  "CFO Email Confidence",
  "Website",
  "Revenue 2027E",
  "EBITDA 2027E",
  "Net Income 2027E",
  "Tangible Equity",
  "Net Debt",
  "Enterprise Value",
  "Implied Forward P/E",
  "Implied EV/EBITDA",
  "Implied Price/Sales",
  "Peer Forward P/E Range",
  "Peer EV/EBITDA Range",
  "Source",
  "Source URL",
  "Last Verified",
];

/** "17.0-26.0" for a peer range, blank-safe. */
function range(value: { low: number; high: number } | null): string | null {
  return value ? `${value.low.toFixed(1)}-${value.high.toFixed(1)}` : null;
}

/**
 * Serialise the *currently filtered* rows. Exporting what the user is looking
 * at rather than the whole dataset is the behaviour people actually expect
 * from a filtered table.
 */
export function toCsv(records: IpoRecord[]): string {
  const lines = [HEADERS.map(cell).join(",")];

  for (const r of records) {
    const fin = r.financials;
    // The final forecast year is what the multiples are struck against.
    const forecast = fin?.years[fin.years.length - 1] ?? null;

    lines.push(
      [
        cell(r.companyName),
        cell(EXCHANGES[r.exchange].name),
        cell(r.exchange),
        cell(r.expectedListingDate),
        cell(r.dateConfidence),
        cell(SECTORS[r.sector].label),
        cell(r.businessDescription),
        cell(r.expectedValuation?.usdAmount ?? null),
        cell(r.expectedValuation?.localAmount ?? null),
        cell(r.expectedValuation?.currency ?? null),
        cell(r.status),
        cell(r.ceo.name),
        cell(r.ceo.email),
        cell(r.ceo.emailProvenance),
        cell(r.cfo.name),
        cell(r.cfo.email),
        cell(r.cfo.emailProvenance),
        cell(r.website),
        cell(forecast?.revenue ?? null),
        cell(forecast?.ebitda ?? null),
        cell(forecast?.netIncome ?? null),
        cell(fin?.balanceSheet.tangibleEquity ?? null),
        cell(fin?.balanceSheet.netDebt ?? null),
        cell(fin?.enterpriseValue ?? null),
        cell(fin?.benchmark.impliedForwardPe ?? null),
        cell(fin?.benchmark.impliedEvEbitda ?? null),
        cell(fin?.benchmark.impliedPriceSales ?? null),
        cell(range(fin?.benchmark.peerForwardPe ?? null)),
        cell(range(fin?.benchmark.peerEvEbitda ?? null)),
        cell(r.sourceRef.label),
        cell(r.sourceRef.url),
        cell(r.sourceRef.lastVerified),
      ].join(","),
    );
  }

  return lines.join("\r\n");
}

/** Trigger a browser download of the given rows. */
export function downloadCsv(records: IpoRecord[], filename: string): void {
  // BOM so Excel opens the non-ASCII company names correctly.
  const blob = new Blob(["﻿", toCsv(records)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
