"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { IpoTable } from "@/components/IpoTable";
import { Logo } from "@/components/Logo";
import { SummaryBar } from "@/components/SummaryBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { computeStats } from "@/lib/dataset";
import { downloadCsv } from "@/lib/csv";
import {
  applyFilters,
  applySort,
  EMPTY_FILTERS,
  type Filters,
  type Sort,
  type SortKey,
} from "@/lib/filter";
import { useBookmarks, useCopy } from "@/lib/hooks";
import type { IpoRecord } from "@/lib/types";

export function Dashboard({ records }: { records: IpoRecord[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<Sort>({
    key: "expectedListingDate",
    direction: "asc",
  });
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const bookmarks = useBookmarks();
  const { copied, copy } = useCopy();

  const visible = useMemo(() => {
    const filtered = applyFilters(records, filters, bookmarks.ids);
    return applySort(filtered, sort);
  }, [records, filters, bookmarks.ids, sort]);

  const stats = useMemo(() => computeStats(visible), [visible]);

  /** First click sorts ascending; clicking the active column flips it. */
  function handleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  function handleToggleExpand(id: string) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((existing) => existing !== id)
        : [...current, id],
    );
  }

  /**
   * Return the dashboard to its landing state: clears the search and every
   * filter, restores the default sort, and collapses any open rows. Bookmarks
   * are saved data rather than view state, so they survive.
   */
  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setSort({ key: "expectedListingDate", direction: "asc" });
    setExpandedIds([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleExport() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(visible, `ipo-pipeline-${stamp}.csv`);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-bg">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-[14px] font-semibold tracking-[-0.01em] text-text">
              <button
                type="button"
                onClick={handleReset}
                title="Reset all filters and return to the full list"
                className="flex items-center gap-2 transition-opacity hover:opacity-60"
              >
                <Logo size={17} className="shrink-0" />
                Global IPO Pipeline
              </button>
            </h1>
            <span className="hidden text-[11.5px] text-text-muted sm:inline">
              Upcoming listings across 11 exchanges
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/methodology"
              className="hidden h-8 items-center rounded-sm border border-line bg-surface px-2.5 text-[12px] text-text-muted transition-colors hover:border-line-strong hover:text-text sm:inline-flex"
            >
              Data &amp; methodology
            </Link>
            <ThemeToggle />
          </div>
        </div>

      </header>

      <SummaryBar stats={stats} />

      <FilterBar
        allRecords={records}
        filters={filters}
        onChange={setFilters}
        resultCount={visible.length}
        bookmarkCount={bookmarks.ids.length}
        onExport={handleExport}
      />

      <main className="flex-1">
        <IpoTable
          records={visible}
          sort={sort}
          onSort={handleSort}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          bookmarkedIds={bookmarks.ids}
          onToggleBookmark={bookmarks.toggle}
          copied={copied}
          onCopy={copy}
        />
      </main>

      <footer className="mt-auto border-t border-line bg-surface px-4 py-3">
        <p className="text-[11px] text-text-muted">
          Click any row for the full description, both contacts, and the source
          this record would be drawn from. Email confidence is marked{" "}
          <span className="text-text">verified</span>,{" "}
          <span className="text-text">inferred</span>, or{" "}
          <span className="text-text">unavailable</span> — inferred addresses
          are pattern-derived and unconfirmed.
        </p>

        {/* Provenance note. Moved out of the header so it does not consume the
            top of the page, but kept on the dashboard itself rather than only
            on the methodology page. */}
        <div className="mt-2 flex items-start gap-2 border-t border-line pt-2">
          <span className="mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
          <p className="text-[11px] leading-snug text-text-muted">
            <span className="font-medium text-text">Demonstration dataset.</span>{" "}
            All 70 companies are fictional. No free API covers the IPO pipelines
            of these exchanges, so this models the exact shape a live feed would
            produce — every record names the official source it would come from.{" "}
            <Link
              href="/methodology"
              className="underline decoration-line-strong underline-offset-2 hover:text-text"
            >
              How this would be sourced for real
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
