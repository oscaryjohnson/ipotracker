"use client";

import { Fragment, useState } from "react";
import { EXCHANGES } from "@/data/exchanges";
import { SECTORS } from "@/data/sectors";
import { AdditionalInfo } from "@/components/AdditionalInfo";
import {
  EmailField,
  Missing,
  SectorTag,
  StatusBadge,
} from "@/components/primitives";
import {
  DATE_CONFIDENCE_LABEL,
  daysUntil,
  formatDateLong,
  formatLocal,
  formatUsdCompact,
  formatValuation,
} from "@/lib/format";
import type { Sort, SortKey } from "@/lib/filter";
import type { IpoRecord } from "@/lib/types";

const COLUMNS: { key: SortKey | null; label: string; className: string }[] = [
  { key: null, label: "", className: "w-8" },
  { key: "companyName", label: "Company", className: "min-w-[220px]" },
  { key: "exchange", label: "Exchange", className: "w-[150px]" },
  { key: "expectedListingDate", label: "Listing Date", className: "w-[130px]" },
  { key: "sector", label: "Sector", className: "w-[130px]" },
  {
    key: "expectedValuation",
    label: "Valuation",
    className: "w-[110px] text-right",
  },
  { key: null, label: "CEO", className: "w-[170px]" },
  { key: null, label: "CFO", className: "w-[170px]" },
  { key: null, label: "", className: "w-10" },
];

function SortArrow({ direction }: { direction: "asc" | "desc" | null }) {
  if (!direction) {
    return (
      <svg
        viewBox="0 0 10 10"
        className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-40"
        aria-hidden
      >
        <path
          d="M5 1.5L7.5 4.5h-5L5 1.5zM5 8.5L2.5 5.5h5L5 8.5z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden>
      <path
        d={direction === "asc" ? "M5 2L8 6.5H2L5 2z" : "M5 8L2 3.5h6L5 8z"}
        fill="currentColor"
      />
    </svg>
  );
}

function BookmarkButton({
  saved,
  onToggle,
  company,
}: {
  saved: boolean;
  onToggle: () => void;
  company: string;
}) {
  // Kept faintly visible rather than hidden until hover: a control nobody can
  // see is a control nobody uses.
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-label={saved ? `Remove ${company} from saved` : `Save ${company}`}
      aria-pressed={saved}
      className={`flex h-6 w-6 items-center justify-center rounded-sm transition-all ${
        saved
          ? "text-text opacity-100"
          : "text-text-faint opacity-40 hover:text-text hover:opacity-100 group-hover/row:opacity-70"
      }`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path
          d="M4.5 2.75h7a.75.75 0 01.75.75v9.25L8 10.5l-4.25 2.25V3.5a.75.75 0 01.75-.75z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={active}
      role="tab"
      className={`-mb-px border-b-2 px-3 py-1.5 text-[12px] transition-colors ${
        active
          ? "border-text text-text"
          : "border-transparent text-text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

/** The company summary: description, key dates, and both contacts. */
function Overview({
  record,
  copied,
  onCopy,
}: {
  record: IpoRecord;
  copied: string | null;
  onCopy: (value: string) => void;
}) {
  const meta = EXCHANGES[record.exchange];
  const days = daysUntil(record.expectedListingDate);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
            Business description
          </h3>
          {record.businessDescription ? (
            <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-text">
              {record.businessDescription}
            </p>
          ) : (
            <p className="mt-1.5 text-[13px] text-text-faint">
              No description published. Early-stage listings frequently have no
              prospectus text available yet.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
              Status
            </div>
            <div className="mt-1">
              <StatusBadge status={record.status} />
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
              Listing date
            </div>
            <div className="mt-1 text-[13px] text-text">
              {formatDateLong(record.expectedListingDate)}
              <span className="ml-2 text-[11px] text-text-muted">
                {DATE_CONFIDENCE_LABEL[record.dateConfidence]}
                {days !== null && days >= 0 ? ` · in ${days} days` : ""}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
              Expected valuation
            </div>
            <div className="tabular mt-1 text-[13px] text-text">
              {record.expectedValuation ? (
                <>
                  {formatUsdCompact(record.expectedValuation.usdAmount)}
                  <span className="ml-2 text-[11px] text-text-muted">
                    {formatLocal(record.expectedValuation)}
                  </span>
                </>
              ) : (
                <Missing reason="No valuation range signalled by the company." />
              )}
            </div>
          </div>
        </div>

        {record.website ? (
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
              Website
            </div>
            <a
              href={record.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-[12.5px] text-text underline decoration-line-strong underline-offset-2 hover:decoration-text-muted"
            >
              {record.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        ) : null}
      </div>

      <div className="min-w-0 space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
            Chief Executive Officer
          </div>
          <div className="mt-1 text-[13px] text-text">
            {record.ceo.name ?? <Missing />}
          </div>
        </div>
        <EmailField
          contact={record.ceo}
          role="CEO"
          copied={copied}
          onCopy={onCopy}
        />
      </div>

      <div className="min-w-0 space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
            Chief Financial Officer
          </div>
          <div className="mt-1 text-[13px] text-text">
            {record.cfo.name ?? (
              <Missing reason="No CFO named in public filings at this stage." />
            )}
          </div>
        </div>
        <EmailField
          contact={record.cfo}
          role="CFO"
          copied={copied}
          onCopy={onCopy}
        />

        <div className="border-t border-line pt-3">
          <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
            Production source
          </div>
          <a
            href={record.sourceRef.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-[12px] leading-snug text-text-muted underline decoration-line-strong underline-offset-2 hover:text-text"
          >
            {record.sourceRef.label}
          </a>
          <p className="mt-1.5 max-w-xs text-[11px] leading-snug text-text-faint">
            {meta.productionSource.acquisitionNote}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The panel revealed under a row.
 *
 * Split into tabs because the two halves answer different questions -- who the
 * company is and how to reach them, versus what the numbers look like. Putting
 * both on one surface made the row several screens tall.
 */
function DetailPanel({
  record,
  copied,
  onCopy,
}: {
  record: IpoRecord;
  copied: string | null;
  onCopy: (value: string) => void;
}) {
  const [tab, setTab] = useState<"overview" | "financials">("overview");

  return (
    <div className="border-l-2 border-line-strong bg-surface px-6 py-4">
      <div className="mb-4 flex items-center gap-1 border-b border-line" role="tablist">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          Overview
        </TabButton>
        <TabButton
          active={tab === "financials"}
          onClick={() => setTab("financials")}
        >
          Financials
        </TabButton>
        {!record.financials ? (
          <span className="ml-1 text-[10.5px] uppercase tracking-[0.06em] text-text-faint">
            no filing
          </span>
        ) : null}
      </div>

      {tab === "overview" ? (
        <Overview record={record} copied={copied} onCopy={onCopy} />
      ) : (
        <AdditionalInfo financials={record.financials} />
      )}
    </div>
  );
}

export function IpoTable({
  records,
  sort,
  onSort,
  expandedIds,
  onToggleExpand,
  bookmarkedIds,
  onToggleBookmark,
  copied,
  onCopy,
}: {
  records: IpoRecord[];
  sort: Sort;
  onSort: (key: SortKey) => void;
  expandedIds: string[];
  onToggleExpand: (id: string) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  copied: string | null;
  onCopy: (value: string) => void;
}) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <p className="text-[14px] text-text">No listings match these filters.</p>
        <p className="max-w-sm text-[12.5px] text-text-muted">
          Try clearing the search box, or widening the exchange and sector
          selections.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line-strong">
            {COLUMNS.map((column, index) => {
              const isSorted = column.key !== null && sort.key === column.key;
              return (
                <th
                  key={`${column.label}-${index}`}
                  scope="col"
                  className={`sticky top-0 z-10 bg-bg px-3 py-2 text-[10.5px] font-medium uppercase tracking-[0.09em] text-text-muted ${column.className}`}
                  aria-sort={
                    isSorted
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {column.key ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key!)}
                      className={`group inline-flex items-center gap-1.5 transition-colors hover:text-text ${
                        isSorted ? "text-text" : ""
                      } ${column.className.includes("text-right") ? "w-full justify-end" : ""}`}
                    >
                      {column.label}
                      <SortArrow direction={isSorted ? sort.direction : null} />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {records.map((record) => {
            const expanded = expandedIds.includes(record.id);
            const saved = bookmarkedIds.includes(record.id);
            const meta = EXCHANGES[record.exchange];

            return (
              <Fragment key={record.id}>
                <tr
                  onClick={() => onToggleExpand(record.id)}
                  className={`group/row cursor-pointer border-b border-line transition-colors hover:bg-surface-2 ${
                    expanded ? "bg-surface-2" : ""
                  }`}
                >
                  <td className="px-2 py-2.5 align-middle">
                    <BookmarkButton
                      saved={saved}
                      company={record.companyName}
                      onToggle={() => onToggleBookmark(record.id)}
                    />
                  </td>

                  <td className="px-3 py-2.5 align-middle">
                    <span className="text-[13px] font-medium text-text">
                      {record.companyName}
                    </span>
                  </td>

                  {/* ISO code rather than the full country name: "United Arab
                      Emirates" wraps and makes that one row taller than the
                      rest, which reads as a rendering bug at this density. */}
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <span className="text-[12.5px] text-text">
                      {meta.shortName}
                    </span>
                    <span
                      className="ml-1.5 text-[11px] text-text-faint"
                      title={meta.country}
                    >
                      {meta.countryCode}
                    </span>
                  </td>

                  <td className="tabular px-3 py-2.5 align-middle text-[12.5px]">
                    {record.expectedListingDate ? (
                      <span className="text-text">
                        {new Date(
                          record.expectedListingDate,
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      <Missing reason="No listing date announced yet." />
                    )}
                  </td>

                  <td className="px-3 py-2.5 align-middle">
                    <SectorTag label={SECTORS[record.sector].label} />
                  </td>

                  <td className="tabular px-3 py-2.5 text-right align-middle text-[12.5px]">
                    {record.expectedValuation ? (
                      <span className="text-text">
                        {formatValuation(record.expectedValuation)}
                      </span>
                    ) : (
                      <Missing reason="No valuation signalled." />
                    )}
                  </td>

                  <td className="px-3 py-2.5 align-middle text-[12.5px] text-text-muted">
                    {record.ceo.name ?? <Missing />}
                  </td>

                  <td className="px-3 py-2.5 align-middle text-[12.5px] text-text-muted">
                    {record.cfo.name ?? (
                      <Missing reason="No CFO named in public filings." />
                    )}
                  </td>

                  <td className="px-2 py-2.5 align-middle">
                    <span
                      className="flex h-6 w-6 items-center justify-center text-text-faint transition-transform group-hover/row:text-text-muted"
                      style={{
                        transform: expanded ? "rotate(180deg)" : undefined,
                      }}
                      aria-hidden
                    >
                      <svg viewBox="0 0 12 12" className="h-3 w-3">
                        <path
                          d="M3 4.5L6 7.5L9 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </td>
                </tr>

                {expanded ? (
                  <tr className="border-b border-line">
                    <td colSpan={COLUMNS.length} className="p-0">
                      <DetailPanel
                        record={record}
                        copied={copied}
                        onCopy={onCopy}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
