import { EXCHANGES } from "@/data/exchanges";
import { SECTORS } from "@/data/sectors";
import { searchIndex } from "@/lib/format";
import type { ExchangeCode, IpoRecord, SectorCode } from "@/lib/types";

export type SortKey =
  | "companyName"
  | "exchange"
  | "expectedListingDate"
  | "sector"
  | "expectedValuation";

export type SortDirection = "asc" | "desc";

export interface Sort {
  key: SortKey;
  direction: SortDirection;
}

export interface Filters {
  query: string;
  exchanges: ExchangeCode[];
  sectors: SectorCode[];
  bookmarkedOnly: boolean;
}

export const EMPTY_FILTERS: Filters = {
  query: "",
  exchanges: [],
  sectors: [],
  bookmarkedOnly: false,
};

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.exchanges.length > 0 ||
    filters.sectors.length > 0 ||
    filters.bookmarkedOnly
  );
}

export function applyFilters(
  records: IpoRecord[],
  filters: Filters,
  bookmarkedIds: string[],
): IpoRecord[] {
  const query = filters.query.trim().toLowerCase();
  const bookmarks = new Set(bookmarkedIds);

  return records.filter((record) => {
    if (filters.bookmarkedOnly && !bookmarks.has(record.id)) return false;
    if (filters.exchanges.length && !filters.exchanges.includes(record.exchange))
      return false;
    if (filters.sectors.length && !filters.sectors.includes(record.sector))
      return false;
    if (query && !searchIndex(record).includes(query)) return false;
    return true;
  });
}

/**
 * Missing values always sort last, in both directions.
 *
 * Flipping the direction should not drag the 11 undated listings and 11
 * undisclosed valuations to the top -- absent data is not "smallest", it is
 * simply unknown, and burying it keeps the useful rows in view.
 */
function compare(a: IpoRecord, b: IpoRecord, key: SortKey): number {
  switch (key) {
    case "companyName":
      return a.companyName.localeCompare(b.companyName);

    case "exchange":
      return EXCHANGES[a.exchange].shortName.localeCompare(
        EXCHANGES[b.exchange].shortName,
      );

    case "sector":
      return SECTORS[a.sector].label.localeCompare(SECTORS[b.sector].label);

    case "expectedListingDate": {
      if (!a.expectedListingDate && !b.expectedListingDate) return 0;
      if (!a.expectedListingDate) return 1;
      if (!b.expectedListingDate) return -1;
      return a.expectedListingDate.localeCompare(b.expectedListingDate);
    }

    case "expectedValuation": {
      const left = a.expectedValuation?.usdAmount ?? null;
      const right = b.expectedValuation?.usdAmount ?? null;
      if (left === null && right === null) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right;
    }
  }
}

export function applySort(records: IpoRecord[], sort: Sort): IpoRecord[] {
  const sorted = [...records];

  sorted.sort((a, b) => {
    const result = compare(a, b, sort.key);
    if (result === 0) return a.companyName.localeCompare(b.companyName);

    // Records with a missing value returned +/-1 to pin themselves last. Those
    // must not be inverted when the direction flips.
    const aMissing = isMissing(a, sort.key);
    const bMissing = isMissing(b, sort.key);
    if (aMissing !== bMissing) return aMissing ? 1 : -1;

    return sort.direction === "asc" ? result : -result;
  });

  return sorted;
}

function isMissing(record: IpoRecord, key: SortKey): boolean {
  if (key === "expectedListingDate") return record.expectedListingDate === null;
  if (key === "expectedValuation") return record.expectedValuation === null;
  return false;
}
