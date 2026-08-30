"use client";

import { useMemo, useState } from "react";
import {
  formatGbpMillions,
  lseStats,
  type LseAdmission,
  type LseDataset,
} from "@/lib/lse";
import { formatDate } from "@/lib/format";
import { Missing } from "@/components/primitives";

/* -------------------------------------------------------------------------
   The one part of this dashboard running on real data.

   Parsed from the LSE's own monthly Main Market equity factsheets. Kept on a
   separate page rather than merged into the main table precisely because it is
   a different kind of thing: completed admissions rather than a forward
   pipeline, and real rather than modelled.
------------------------------------------------------------------------- */

type SortKey = "admissionDate" | "issuerName" | "marketCapAtAdmission";

export function LseLive({ data }: { data: LseDataset }) {
  const [year, setYear] = useState<number | "all">("all");
  const [iposOnly, setIposOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: "admissionDate",
    desc: true,
  });

  const allYears = useMemo(
    () =>
      [...new Set(data.issues.map((i) => Number(i.admissionDate.slice(0, 4))))].sort(
        (a, b) => b - a,
      ),
    [data.issues],
  );

  const rows = useMemo(() => {
    const filtered = data.issues.filter((issue) => {
      if (iposOnly && !issue.isIpo) return false;
      if (year !== "all" && Number(issue.admissionDate.slice(0, 4)) !== year)
        return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let result: number;
      if (sort.key === "issuerName") {
        result = a.issuerName.localeCompare(b.issuerName);
      } else if (sort.key === "marketCapAtAdmission") {
        const left = a.marketCapAtAdmission;
        const right = b.marketCapAtAdmission;
        if (left === null && right === null) result = 0;
        else if (left === null) return 1;
        else if (right === null) return -1;
        else result = left - right;
      } else {
        result = a.admissionDate.localeCompare(b.admissionDate);
      }
      return sort.desc ? -result : result;
    });

    return sorted;
  }, [data.issues, year, iposOnly, sort]);

  const stats = useMemo(() => lseStats(rows), [rows]);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, desc: !current.desc }
        : { key, desc: key !== "issuerName" },
    );
  }

  const fetched = new Date(data.fetchedAt);

  return (
    <div>
      {/* Real data deserves an explicit marker, the same way the demonstration
          dataset gets one. The distinction is the whole point of this page. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface-2 px-4 py-2">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-text">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ok" />
          Live data
        </span>
        <p className="text-[11.5px] text-text-muted">
          Parsed from the London Stock Exchange&apos;s own monthly factsheets.
          Latest: {data.latestPeriod} · fetched{" "}
          {fetched.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 border-b border-line lg:grid-cols-4">
        {[
          {
            label: "Admissions",
            value: String(stats.admissions),
            sub: "in current view",
          },
          {
            label: "Flagged as IPOs",
            value: String(stats.ipos),
            sub: "LSE's own classification",
          },
          {
            label: "Market cap at admission",
            value: formatGbpMillions(stats.totalMarketCap),
            sub: "combined",
          },
          {
            label: "Factsheets parsed",
            value: String(data.files.length),
            sub: "monthly files",
          },
        ].map((tile, index) => (
          <div
            key={tile.label}
            className={`px-4 py-3 ${index > 0 ? "border-l border-line" : ""} ${
              index >= 2 ? "border-t border-line lg:border-t-0" : ""
            }`}
          >
            <div className="text-[10.5px] uppercase tracking-[0.09em] text-text-faint">
              {tile.label}
            </div>
            <div className="tabular mt-1 text-[20px] font-medium leading-none text-text">
              {tile.value}
            </div>
            <div className="mt-1 text-[11px] text-text-muted">{tile.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-3">
        <button
          type="button"
          onClick={() => setYear("all")}
          className={`h-8 rounded-sm border px-2.5 text-[12px] transition-colors ${
            year === "all"
              ? "border-text bg-text text-bg"
              : "border-line bg-surface text-text-muted hover:border-line-strong hover:text-text"
          }`}
        >
          All years
        </button>
        {allYears.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            className={`tabular h-8 rounded-sm border px-2.5 text-[12px] transition-colors ${
              year === y
                ? "border-text bg-text text-bg"
                : "border-line bg-surface text-text-muted hover:border-line-strong hover:text-text"
            }`}
          >
            {y}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setIposOnly((v) => !v)}
          aria-pressed={iposOnly}
          className={`ml-2 h-8 rounded-sm border px-2.5 text-[12px] transition-colors ${
            iposOnly
              ? "border-text bg-text text-bg"
              : "border-line bg-surface text-text-muted hover:border-line-strong hover:text-text"
          }`}
        >
          IPOs only
        </button>

        <span className="tabular ml-auto text-[12px] text-text-muted">
          {rows.length} of {data.issues.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line-strong">
              {[
                { label: "Admission", key: "admissionDate" as SortKey },
                { label: "Issuer", key: "issuerName" as SortKey },
                { label: "Ticker", key: null },
                { label: "Type", key: null },
                { label: "ICB Sector", key: null },
                { label: "Country", key: null },
                {
                  label: "Mkt cap",
                  key: "marketCapAtAdmission" as SortKey,
                  right: true,
                },
                { label: "Raised", key: null, right: true },
              ].map((col) => (
                <th
                  key={col.label}
                  scope="col"
                  className={`px-3 py-2 text-[10.5px] font-medium uppercase tracking-[0.09em] text-text-muted ${
                    col.right ? "text-right" : ""
                  }`}
                >
                  {col.key ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key!)}
                      className={`transition-colors hover:text-text ${
                        sort.key === col.key ? "text-text" : ""
                      }`}
                    >
                      {col.label}
                      {sort.key === col.key ? (sort.desc ? " ↓" : " ↑") : ""}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row key={`${row.admissionDate}-${row.issuerName}`} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-16 text-center text-[13px] text-text-muted">
          No admissions match this filter.
        </p>
      ) : null}
    </div>
  );
}

function Row({ row }: { row: LseAdmission }) {
  return (
    <tr className="border-b border-line transition-colors hover:bg-surface-2">
      <td className="tabular whitespace-nowrap px-3 py-2.5 text-[12.5px] text-text">
        {formatDate(row.admissionDate)}
      </td>
      <td className="px-3 py-2.5 text-[13px] font-medium text-text">
        {row.issuerName}
        {row.isIpo ? (
          <span className="ml-2 rounded-sm border border-text-muted px-1.5 py-[1px] text-[10px] font-medium uppercase tracking-[0.08em] text-text">
            IPO
          </span>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12px] text-text-muted">
        {row.symbols.length ? row.symbols.join(", ") : <Missing />}
      </td>
      <td className="px-3 py-2.5 text-[12px] text-text-muted">
        {row.issueType ?? <Missing />}
      </td>
      <td className="px-3 py-2.5 text-[11.5px] uppercase tracking-[0.04em] text-text-muted">
        {row.icbSector ?? <Missing reason="No ICB sector given in the factsheet." />}
      </td>
      <td className="px-3 py-2.5 text-[12px] text-text-muted">
        {row.countryOfIncorporation ?? <Missing />}
      </td>
      <td className="tabular whitespace-nowrap px-3 py-2.5 text-right text-[12.5px] text-text">
        {row.marketCapAtAdmission === null ? (
          <Missing />
        ) : (
          formatGbpMillions(row.marketCapAtAdmission)
        )}
      </td>
      <td className="tabular whitespace-nowrap px-3 py-2.5 text-right text-[12.5px] text-text-muted">
        {row.moneyRaised === null || row.moneyRaised === 0 ? (
          <span className="text-text-faint" title="No new shares issued — transfers and introductions raise nothing.">
            —
          </span>
        ) : (
          formatGbpMillions(row.moneyRaised)
        )}
      </td>
    </tr>
  );
}
