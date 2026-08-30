import type { DateConfidence, IpoRecord, Valuation } from "@/lib/types";

/** What we render wherever a value is genuinely absent. */
export const NA = "N/A";

/**
 * Compact USD, e.g. $3.94B / $740M. Valuations here span three orders of
 * magnitude across markets, so a fixed unit would either lose precision on the
 * small end or overwhelm the column on the large end.
 */
export function formatUsdCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `$${Math.round(amount / 1_000_000)}M`;
  return `$${amount.toLocaleString("en-US")}`;
}

/** Local-currency figure for the expanded detail, e.g. "GBP 3.10bn". */
export function formatLocal(valuation: Valuation): string {
  const { currency, localAmount } = valuation;
  if (localAmount >= 1_000_000_000)
    return `${currency} ${(localAmount / 1_000_000_000).toFixed(2)}bn`;
  if (localAmount >= 1_000_000)
    return `${currency} ${Math.round(localAmount / 1_000_000)}m`;
  return `${currency} ${localAmount.toLocaleString("en-US")}`;
}

export function formatValuation(valuation: Valuation | null): string {
  return valuation ? formatUsdCompact(valuation.usdAmount) : NA;
}

/**
 * Parse a calendar date without letting the viewer's timezone shift it.
 *
 * `new Date("2026-07-31")` is parsed as UTC midnight, so anywhere west of
 * Greenwich it renders as 30 July. A listing date is a calendar date, not an
 * instant -- it does not move depending on who is reading the page. Building
 * the Date from its parts pins it to local midnight instead.
 */
function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "24 Sep 2026", or N/A when the market has no date yet. */
export function formatDate(iso: string | null): string {
  if (!iso) return NA;
  const date = parseIsoDate(iso);
  if (!date) return NA;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(iso: string | null): string {
  if (!iso) return "Not yet scheduled";
  const date = parseIsoDate(iso);
  if (!date) return "Not yet scheduled";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export { parseIsoDate };

export const DATE_CONFIDENCE_LABEL: Record<DateConfidence, string> = {
  confirmed: "Confirmed",
  estimated: "Estimated",
  tbd: "TBD",
};

/** Days until listing; negative or null when not applicable. */
export function daysUntil(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const date = parseIsoDate(iso);
  if (!date) return null;
  const ms = date.getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

/** Text shown when a field is missing, with a reason where we have one. */
export function displayOrNa(value: string | null | undefined): string {
  return value && value.trim() ? value : NA;
}

/**
 * Local-currency figure without the currency code, e.g. "1.24bn", "(42.0m)".
 *
 * Losses use accounting parentheses rather than a minus sign -- at small type
 * in a dense table a leading hyphen is easy to miss, and these tables carry
 * genuine negatives (pre-profit biotechs, net cash positions).
 */
export function formatFigure(amount: number): string {
  const negative = amount < 0;
  const value = Math.abs(amount);

  let text: string;
  if (value >= 1_000_000_000) text = `${(value / 1_000_000_000).toFixed(2)}bn`;
  else if (value >= 1_000_000) text = `${(value / 1_000_000).toFixed(1)}m`;
  else if (value >= 1_000) text = `${(value / 1_000).toFixed(0)}k`;
  else text = value.toFixed(0);

  return negative ? `(${text})` : text;
}

/** "12.4×", or N/A when the multiple is not calculable. */
export function formatMultiple(value: number | null): string {
  return value === null ? NA : `${value.toFixed(1)}×`;
}

/** "17.0–26.0×" for a peer range. */
export function formatRange(
  range: { low: number; high: number } | null,
): string {
  if (!range) return NA;
  return `${range.low.toFixed(1)}–${range.high.toFixed(1)}×`;
}

/**
 * Where an implied multiple sits against its peer range.
 * Drives the one-word verdict shown beside it.
 */
export function multipleVsPeers(
  implied: number | null,
  range: { low: number; high: number } | null,
): "below" | "within" | "above" | null {
  if (implied === null || !range) return null;
  if (implied < range.low) return "below";
  if (implied > range.high) return "above";
  return "within";
}

/** Every searchable string for a record, lowercased once. */
export function searchIndex(record: IpoRecord): string {
  return [
    record.companyName,
    record.ceo.name,
    record.cfo.name,
    record.businessDescription,
    record.ceo.email,
    record.cfo.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
