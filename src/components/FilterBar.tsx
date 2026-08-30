"use client";

import { useMemo } from "react";
import { EXCHANGES, EXCHANGE_CODES } from "@/data/exchanges";
import { SECTORS, SECTOR_CODES } from "@/data/sectors";
import { MultiSelect } from "@/components/MultiSelect";
import { hasActiveFilters, type Filters } from "@/lib/filter";
import type { ExchangeCode, IpoRecord, SectorCode } from "@/lib/types";

/**
 * Option counts are computed against the whole dataset rather than the current
 * result set, so the numbers stay stable as the user narrows down. A count
 * that changes every keystroke is noise, not information.
 */
function useCounts(records: IpoRecord[]) {
  return useMemo(() => {
    const exchange = new Map<ExchangeCode, number>();
    const sector = new Map<SectorCode, number>();
    for (const record of records) {
      exchange.set(record.exchange, (exchange.get(record.exchange) ?? 0) + 1);
      sector.set(record.sector, (sector.get(record.sector) ?? 0) + 1);
    }
    return { exchange, sector };
  }, [records]);
}

export function FilterBar({
  allRecords,
  filters,
  onChange,
  resultCount,
  bookmarkCount,
  onExport,
}: {
  allRecords: IpoRecord[];
  filters: Filters;
  onChange: (next: Filters) => void;
  resultCount: number;
  bookmarkCount: number;
  onExport: () => void;
}) {
  const counts = useCounts(allRecords);

  const exchangeOptions = EXCHANGE_CODES.map((code) => ({
    value: code,
    label: `${EXCHANGES[code].shortName} · ${EXCHANGES[code].country}`,
    count: counts.exchange.get(code) ?? 0,
  }));

  const sectorOptions = SECTOR_CODES.map((code) => ({
    value: code,
    label: SECTORS[code].label,
    count: counts.sector.get(code) ?? 0,
  }));

  const active = hasActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-3">
      <div className="relative">
        <svg
          viewBox="0 0 16 16"
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-faint"
          aria-hidden
        >
          <circle
            cx="7"
            cy="7"
            r="4.25"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
          />
          <path
            d="M10.25 10.25L13.5 13.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          value={filters.query}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
          placeholder="Search for companies, people, or keywords"
          aria-label="Search for companies, people, or keywords"
          className="h-8 w-80 rounded-sm border border-line bg-bg pl-8 pr-2.5 text-[12.5px] text-text placeholder:text-text-faint focus:border-line-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>

      <MultiSelect
        label="Exchange"
        options={exchangeOptions}
        selected={filters.exchanges}
        onChange={(exchanges) => onChange({ ...filters, exchanges })}
      />

      <MultiSelect
        label="Sector"
        options={sectorOptions}
        selected={filters.sectors}
        onChange={(sectors) => onChange({ ...filters, sectors })}
      />

      <button
        type="button"
        onClick={() =>
          onChange({ ...filters, bookmarkedOnly: !filters.bookmarkedOnly })
        }
        aria-pressed={filters.bookmarkedOnly}
        className={`inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-[12px] transition-colors ${
          filters.bookmarkedOnly
            ? "border-text bg-text text-bg"
            : "border-line bg-surface text-text-muted hover:border-line-strong hover:text-text"
        }`}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M4.5 2.75h7a.75.75 0 01.75.75v9.25L8 10.5l-4.25 2.25V3.5a.75.75 0 01.75-.75z"
            fill={filters.bookmarkedOnly ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
        Saved
        {bookmarkCount > 0 ? (
          <span className="tabular text-[11px] opacity-70">{bookmarkCount}</span>
        ) : null}
      </button>

      {active ? (
        <button
          type="button"
          onClick={() =>
            onChange({
              query: "",
              exchanges: [],
              sectors: [],
              bookmarkedOnly: false,
            })
          }
          className="h-8 rounded-sm px-2 text-[12px] text-text-muted underline decoration-line-strong underline-offset-2 hover:text-text"
        >
          Reset
        </button>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        <span className="tabular text-[12px] text-text-muted">
          {resultCount} of {allRecords.length}
        </span>
        <button
          type="button"
          onClick={onExport}
          disabled={resultCount === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 text-[12px] text-text-muted transition-colors hover:border-line-strong hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path
              d="M8 2.75v7.5m0 0L5.25 7.5M8 10.25l2.75-2.75M3 12.5h10"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}
