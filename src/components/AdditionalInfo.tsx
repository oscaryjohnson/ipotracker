"use client";

import Link from "next/link";
import { Missing } from "@/components/primitives";
import {
  formatFigure,
  formatMultiple,
  formatRange,
  multipleVsPeers,
} from "@/lib/format";
import type { Financials } from "@/lib/types";

/* -------------------------------------------------------------------------
   Prospectus financials and underwriter valuation benchmarking.

   Three blocks, mirroring how a prospectus presents them: the income
   statement history and forecast, the balance sheet and cash flow summary,
   and the comparable-company analysis that justifies the price.
------------------------------------------------------------------------- */

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-1.5 last:border-b-0">
      <span className="text-[12px] text-text-muted">{label}</span>
      <span
        className={`tabular text-[12.5px] ${emphasis ? "font-medium text-text" : "text-text"}`}
      >
        {value}
      </span>
    </div>
  );
}

function IncomeStatement({ financials }: { financials: Financials }) {
  const rows = [
    { label: "Revenue", key: "revenue" as const },
    { label: "EBITDA", key: "ebitda" as const },
    { label: "Net income", key: "netIncome" as const },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h4 className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
          Income statement
        </h4>
        <span className="text-[10.5px] text-text-faint">
          {financials.currency}, E = forecast
        </span>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-right">
          <thead>
            <tr className="border-b border-line-strong">
              <th className="py-1.5 pr-3 text-left text-[10.5px] font-medium uppercase tracking-[0.06em] text-text-muted">
                {""}
              </th>
              {financials.years.map((year) => (
                <th
                  key={year.label}
                  className={`tabular py-1.5 pl-3 text-[11px] font-medium ${
                    year.projected ? "text-text-faint" : "text-text-muted"
                  }`}
                >
                  {year.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-line last:border-b-0">
                <td className="py-1.5 pr-3 text-left text-[12px] text-text-muted">
                  {row.label}
                </td>
                {financials.years.map((year) => (
                  <td
                    key={year.label}
                    className={`tabular py-1.5 pl-3 text-[12.5px] ${
                      year.projected ? "text-text-muted" : "text-text"
                    }`}
                  >
                    {formatFigure(year[row.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] leading-snug text-text-faint">
        Figures restated from the prospectus financial statements. Forecast
        years are the underwriter&apos;s projections, not company guidance.
      </p>
    </div>
  );
}

function BalanceSheet({ financials }: { financials: Financials }) {
  const b = financials.balanceSheet;
  const netCash = b.netDebt < 0;

  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
        Balance sheet &amp; cash flow
      </h4>
      <div className="mt-2">
        <Row label="Total assets" value={formatFigure(b.totalAssets)} />
        <Row label="Total equity" value={formatFigure(b.totalEquity)} />
        <Row
          label="Tangible equity (book value)"
          value={formatFigure(b.tangibleEquity)}
          emphasis
        />
        <Row
          label={netCash ? "Net cash" : "Net debt"}
          value={formatFigure(Math.abs(b.netDebt))}
        />
        <Row
          label="Operating cash flow"
          value={formatFigure(b.operatingCashFlow)}
        />
        <Row label="Free cash flow" value={formatFigure(b.freeCashFlow)} />
        <Row
          label="Enterprise value"
          value={
            financials.enterpriseValue === null ? (
              <Missing reason="No valuation disclosed, so enterprise value cannot be derived." />
            ) : (
              formatFigure(financials.enterpriseValue)
            )
          }
          emphasis
        />
      </div>
    </div>
  );
}

function Benchmarking({ financials }: { financials: Financials }) {
  const b = financials.benchmark;
  const peVerdict = multipleVsPeers(b.impliedForwardPe, b.peerForwardPe);
  const evVerdict = multipleVsPeers(b.impliedEvEbitda, b.peerEvEbitda);

  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
        Valuation benchmarking
      </h4>

      <div className="mt-2">
        <Row
          label="Peer forward P/E"
          value={formatRange(b.peerForwardPe)}
        />
        <Row label="Peer EV/EBITDA" value={formatRange(b.peerEvEbitda)} />
        <Row
          label="Implied forward P/E"
          value={
            <span>
              {formatMultiple(b.impliedForwardPe)}
              {peVerdict ? (
                <span className="ml-1.5 text-[10.5px] uppercase tracking-[0.06em] text-text-faint">
                  {peVerdict}
                </span>
              ) : null}
            </span>
          }
          emphasis
        />
        <Row
          label="Implied EV/EBITDA"
          value={
            <span>
              {formatMultiple(b.impliedEvEbitda)}
              {evVerdict ? (
                <span className="ml-1.5 text-[10.5px] uppercase tracking-[0.06em] text-text-faint">
                  {evVerdict}
                </span>
              ) : null}
            </span>
          }
          emphasis
        />
        <Row
          label="Implied price / sales"
          value={formatMultiple(b.impliedPriceSales)}
        />
      </div>

      <p className="mt-2.5 text-[11px] leading-snug text-text-faint">
        {b.peerSetNote}
      </p>

      {b.notMeaningfulNote ? (
        <p className="mt-2 border-l-2 border-line-strong pl-2 text-[11px] leading-snug text-text-muted">
          {b.notMeaningfulNote}
        </p>
      ) : null}
    </div>
  );
}

export function AdditionalInfo({
  financials,
}: {
  financials: Financials | null;
}) {
  if (!financials) {
    return (
      <div className="max-w-prose py-2">
        <p className="text-[13px] text-text">
          No financial disclosure available.
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">
          This listing is at the rumoured stage with no prospectus lodged and no
          valuation signalled. Financial statements and underwriter benchmarking
          only become available once a company files, so there is nothing to
          report here yet rather than an estimate standing in for it.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <IncomeStatement financials={financials} />
      </div>
      <div className="min-w-0">
        <BalanceSheet financials={financials} />
      </div>
      <div className="min-w-0">
        <Benchmarking financials={financials} />
        <p className="mt-3 border-t border-line pt-2 text-[11px] leading-snug text-text-faint">
          Sourced in production from prospectus financial statements and
          comparable-company multiples.{" "}
          <Link
            href="/methodology"
            className="underline decoration-line-strong underline-offset-2 hover:text-text"
          >
            Financial data sources
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
