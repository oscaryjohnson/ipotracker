/**
 * Core domain types for the IPO tracker.
 *
 * The shape here deliberately mirrors what a real ingestion pipeline would
 * emit: every record carries the provenance of where it came from, and every
 * contact email carries how confident we are in it. See `src/data/exchanges.ts`
 * for the per-exchange production sources these fields map onto.
 */

export type ExchangeCode =
  | "LSE"
  | "WSE"
  | "DFM"
  | "TADAWUL"
  | "JSE"
  | "B3"
  | "SGX"
  | "TWSE"
  | "SET"
  | "KLSE"
  | "XETRA";

export type SectorCode =
  | "biotech"
  | "ai-software"
  | "fintech"
  | "energy"
  | "metals-mining"
  | "consumer"
  | "industrials"
  | "healthcare"
  | "real-estate"
  | "logistics"
  | "telecom";

/**
 * How much we trust an email address.
 *
 * - `verified`   a published address (investor relations desk, press contact)
 * - `inferred`   built from a confirmed company-domain pattern, NOT confirmed
 * - `unavailable` no defensible basis for an address; renders as N/A
 *
 * Guessed addresses are never presented as verified. The UI badges the
 * difference so nobody mistakes a pattern match for a real contact.
 */
export type EmailProvenance = "verified" | "inferred" | "unavailable";

/**
 * How a record would be acquired in production. Drives the methodology page
 * and the "how we'd source this" note on each expanded row.
 */
export type SourceTier =
  | "structured-feed" // official machine-readable file (e.g. LSE's XLSX)
  | "html-scrape" // parseable table on the exchange's own site
  | "pdf-extract" // prospectus PDFs / press releases, needs text extraction
  | "vendor-api"; // commercial aggregator, paid tier

/** Confidence in the expected listing date. */
export type DateConfidence = "confirmed" | "estimated" | "tbd";

/** Where the offering sits in the pipeline. */
export type IpoStatus = "filed" | "approved" | "rumoured";

export interface Contact {
  name: string | null;
  email: string | null;
  emailProvenance: EmailProvenance;
  /** Short human explanation shown on hover/expand, e.g. why it's N/A. */
  emailNote?: string;
}

export interface Valuation {
  currency: string;
  /** Amount in the exchange's local currency. */
  localAmount: number;
  /** Same amount converted to USD, for cross-exchange sorting. */
  usdAmount: number;
}

export interface SourceRef {
  tier: SourceTier;
  /** Human label for the source, e.g. "LSE New Issues and IPOs (XLSX)". */
  label: string;
  url: string;
  /** ISO date the record was last checked against its source. */
  lastVerified: string;
}

/** One reporting period. `projected` separates actuals from forecast. */
export interface FinancialYear {
  /** "2024" for an actual, "2027E" for an estimate. */
  label: string;
  projected: boolean;
  revenue: number;
  ebitda: number;
  netIncome: number;
}

/** Balance sheet and cash flow, as a prospectus would summarise them. */
export interface BalanceSheetMetrics {
  totalAssets: number;
  totalEquity: number;
  /** Equity less intangibles and goodwill -- the tangible book value. */
  tangibleEquity: number;
  /** Positive is net borrowings; negative is a net cash position. */
  netDebt: number;
  operatingCashFlow: number;
  freeCashFlow: number;
}

export interface MultipleRange {
  low: number;
  high: number;
}

/**
 * Valuation benchmarking, the section underwriters include in a prospectus.
 *
 * Peer ranges are the comparable-company multiples the banks apply; the
 * implied figures are what the company's own expected valuation works out to
 * against its projections. Showing both is the point -- the gap between them
 * is the argument about whether the deal is priced sensibly.
 */
export interface ValuationBenchmark {
  peerForwardPe: MultipleRange | null;
  peerEvEbitda: MultipleRange | null;
  impliedForwardPe: number | null;
  impliedEvEbitda: number | null;
  impliedPriceSales: number | null;
  /** Which peer set the range is drawn from. */
  peerSetNote: string;
  /** Why a multiple is not meaningful, when it isn't. */
  notMeaningfulNote: string | null;
}

/**
 * What the figures are actually drawn from.
 *
 * - `prospectus`         audited historicals from a lodged filing, plus
 *                        analyst forecasts and peer benchmarking
 * - `statutory-accounts` public annual accounts for a company that has not
 *                        filed yet: history only, no forecasts, no multiples
 */
export type FinancialsBasis = "prospectus" | "statutory-accounts";

export interface Financials {
  currency: string;
  basis: FinancialsBasis;
  /** Names the register or filing the statements come from. */
  basisNote: string;
  /** Financial year end, e.g. "31 December". Year ends vary by market. */
  fiscalYearEnd: string;
  /** Actual years, followed by forecast years only where a prospectus exists. */
  years: FinancialYear[];
  balanceSheet: BalanceSheetMetrics;
  /**
   * Null before a prospectus is lodged. No bank publishes peer analysis on a
   * company that has not filed, so showing a multiple there would be invented.
   */
  benchmark: ValuationBenchmark | null;
  /** Enterprise value used for EV-based multiples: equity value plus net debt. */
  enterpriseValue: number | null;
}

export interface IpoRecord {
  id: string;
  companyName: string;
  exchange: ExchangeCode;
  /** ISO 8601 date, or null when the market has no date yet. */
  expectedListingDate: string | null;
  dateConfidence: DateConfidence;
  sector: SectorCode;
  businessDescription: string | null;
  /** Null when the company has not signalled a valuation range. */
  expectedValuation: Valuation | null;
  ceo: Contact;
  cfo: Contact;
  website: string | null;
  status: IpoStatus;
  sourceRef: SourceRef;
  /**
   * Null for rumoured listings with no lodged prospectus -- there is no
   * financial disclosure to read until a company actually files.
   */
  financials: Financials | null;
}
