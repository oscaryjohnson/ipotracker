"use client";

import { formatUsdCompact } from "@/lib/format";
import type { DatasetStats } from "@/lib/dataset";

/**
 * Headline figures for the current result set.
 *
 * The valuation tile reports its own denominator ("across 59 disclosing") --
 * an aggregate over a dataset with 11 undisclosed valuations is misleading
 * unless it says how many rows it actually covers.
 */
export function SummaryBar({ stats }: { stats: DatasetStats }) {
  const tiles = [
    { label: "Listings", value: String(stats.total), sub: "in current view" },
    {
      label: "Exchanges",
      value: String(stats.exchangeCount),
      sub: "represented",
    },
    {
      label: "Expected valuation",
      value: stats.totalValuationUsd
        ? formatUsdCompact(stats.totalValuationUsd)
        : "—",
      sub: `across ${stats.valuationDisclosed} disclosing`,
    },
    {
      label: "Next 30 days",
      value: String(stats.listingsNext30Days),
      sub: "scheduled listings",
    },
  ];

  return (
    <div className="grid grid-cols-2 border-b border-line lg:grid-cols-4">
      {tiles.map((tile, index) => (
        <div
          key={tile.label}
          className={`px-4 py-3 ${
            index > 0 ? "border-l border-line" : ""
          } ${index === 2 ? "border-t border-line lg:border-t-0" : ""} ${
            index === 3 ? "border-t border-line lg:border-t-0" : ""
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
  );
}
