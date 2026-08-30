import type {
  Financials,
  FinancialYear,
  IpoStatus,
  MultipleRange,
  SectorCode,
} from "@/lib/types";

/**
 * Synthetic prospectus financials.
 *
 * These are derived rather than hand-written, and derived in the direction a
 * real deal works: the company's expected valuation and its sector's peer
 * multiples together imply an EBITDA, which implies revenue, which is grown
 * backwards into a history. That means the numbers on the Financials tab
 * are internally consistent -- the implied EV/EBITDA you see really is the
 * enterprise value divided by the projected EBITDA shown beside it, not a
 * decorative figure. A reviewer who checks the arithmetic will find it holds.
 *
 * Generation is seeded from the company id, so the same company always yields
 * the same figures across reloads and rebuilds.
 */

/* ------------------------------------------------------------------ random */

function seedFrom(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 -- small, fast, and deterministic for a given seed. */
function makeRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(rng: () => number, low: number, high: number): number {
  return low + rng() * (high - low);
}

/** Round to four significant figures so the tables read like reported numbers. */
function sig(value: number, digits = 4): number {
  if (value === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const factor = Math.pow(10, digits - 1 - magnitude);
  return Math.round(value * factor) / factor;
}

/**
 * A stable pseudo-random value in a range, keyed off the company id.
 * Used to size companies that never disclosed a valuation.
 */
export function seededScale(id: string, low: number, high: number): number {
  return between(makeRng(seedFrom(`${id}:scale`)), low, high);
}

/* ---------------------------------------------------------------- profiles */

interface SectorProfile {
  ebitdaMargin: [number, number];
  /** Net income as a share of EBITDA, after D&A, interest and tax. */
  netIncomeConversion: [number, number];
  /** Year-on-year revenue growth. */
  growth: [number, number];
  /** Net debt as a multiple of EBITDA. Negative means a net cash position. */
  leverage: [number, number];
  /** Capex as a share of revenue -- drives free cash flow. */
  capexRate: [number, number];
  /** Equity value as a multiple of book equity, used to size the balance sheet. */
  priceToBook: [number, number];
  peerEvEbitda: MultipleRange;
  peerForwardPe: MultipleRange;
  peerSetNote: string;
  /** Pre-profit sectors get a different treatment entirely. */
  lossMaking?: boolean;
}

const PROFILES: Record<SectorCode, SectorProfile> = {
  "ai-software": {
    ebitdaMargin: [0.18, 0.3],
    netIncomeConversion: [0.5, 0.62],
    growth: [0.18, 0.34],
    leverage: [-0.8, 0.9],
    capexRate: [0.04, 0.08],
    priceToBook: [3.4, 6.2],
    peerEvEbitda: { low: 17, high: 26 },
    peerForwardPe: { low: 26, high: 38 },
    peerSetNote:
      "Benchmarked against listed enterprise software and semiconductor peers trading on forward earnings and EV/EBITDA.",
  },
  biotech: {
    ebitdaMargin: [-0.9, -0.4],
    netIncomeConversion: [1.05, 1.3],
    growth: [0.25, 0.7],
    leverage: [-1.4, -0.4],
    capexRate: [0.08, 0.16],
    priceToBook: [2.6, 5.0],
    peerEvEbitda: { low: 0, high: 0 },
    peerForwardPe: { low: 0, high: 0 },
    peerSetNote:
      "Clinical-stage peers are benchmarked on risk-adjusted pipeline NPV and price/book rather than earnings multiples.",
    lossMaking: true,
  },
  fintech: {
    ebitdaMargin: [0.22, 0.34],
    netIncomeConversion: [0.52, 0.66],
    growth: [0.15, 0.28],
    leverage: [-0.6, 1.4],
    capexRate: [0.03, 0.07],
    priceToBook: [2.4, 4.4],
    peerEvEbitda: { low: 12, high: 18 },
    peerForwardPe: { low: 19, high: 28 },
    peerSetNote:
      "Peer set of listed payments processors and digital banks, weighted toward comparable growth and take-rate profiles.",
  },
  energy: {
    ebitdaMargin: [0.36, 0.52],
    netIncomeConversion: [0.34, 0.48],
    growth: [0.08, 0.19],
    leverage: [1.8, 3.6],
    capexRate: [0.18, 0.32],
    priceToBook: [1.2, 2.1],
    peerEvEbitda: { low: 6, high: 9.5 },
    peerForwardPe: { low: 11, high: 16 },
    peerSetNote:
      "Independent power producers and renewable developers with comparable contracted offtake profiles.",
  },
  "metals-mining": {
    ebitdaMargin: [0.26, 0.42],
    netIncomeConversion: [0.4, 0.55],
    growth: [0.04, 0.15],
    leverage: [0.6, 2.2],
    capexRate: [0.14, 0.26],
    priceToBook: [1.1, 2.0],
    peerEvEbitda: { low: 4, high: 7 },
    peerForwardPe: { low: 8, high: 13 },
    peerSetNote:
      "Diversified and single-commodity producers, adjusted for reserve life and grade.",
  },
  consumer: {
    ebitdaMargin: [0.09, 0.17],
    netIncomeConversion: [0.44, 0.58],
    growth: [0.06, 0.16],
    leverage: [0.9, 2.4],
    capexRate: [0.04, 0.09],
    priceToBook: [1.8, 3.4],
    peerEvEbitda: { low: 8, high: 12.5 },
    peerForwardPe: { low: 14, high: 21 },
    peerSetNote:
      "Listed branded consumer and food producers with similar channel mix and regional exposure.",
  },
  industrials: {
    ebitdaMargin: [0.13, 0.21],
    netIncomeConversion: [0.45, 0.58],
    growth: [0.05, 0.14],
    leverage: [1.0, 2.6],
    capexRate: [0.05, 0.11],
    priceToBook: [1.6, 3.0],
    peerEvEbitda: { low: 7, high: 11 },
    peerForwardPe: { low: 13, high: 19 },
    peerSetNote:
      "Capital goods and specialty manufacturing peers with comparable order-book visibility.",
  },
  healthcare: {
    ebitdaMargin: [0.17, 0.26],
    netIncomeConversion: [0.46, 0.6],
    growth: [0.09, 0.2],
    leverage: [0.8, 2.3],
    capexRate: [0.07, 0.14],
    priceToBook: [2.2, 4.0],
    peerEvEbitda: { low: 10, high: 15 },
    peerForwardPe: { low: 18, high: 26 },
    peerSetNote:
      "Hospital operators and diagnostics groups, adjusted for payer mix and bed occupancy.",
  },
  "real-estate": {
    ebitdaMargin: [0.55, 0.72],
    netIncomeConversion: [0.4, 0.56],
    growth: [0.03, 0.1],
    leverage: [3.0, 5.5],
    capexRate: [0.1, 0.2],
    priceToBook: [0.85, 1.35],
    peerEvEbitda: { low: 14, high: 20 },
    peerForwardPe: { low: 15, high: 22 },
    peerSetNote:
      "Listed REITs and property developers, benchmarked primarily on price to tangible book and yield.",
  },
  logistics: {
    ebitdaMargin: [0.12, 0.22],
    netIncomeConversion: [0.42, 0.56],
    growth: [0.06, 0.15],
    leverage: [1.4, 3.0],
    capexRate: [0.08, 0.17],
    priceToBook: [1.4, 2.8],
    peerEvEbitda: { low: 6, high: 10 },
    peerForwardPe: { low: 12, high: 17 },
    peerSetNote:
      "Freight forwarders, terminal operators and contract logistics peers on comparable route density.",
  },
  telecom: {
    ebitdaMargin: [0.34, 0.48],
    netIncomeConversion: [0.3, 0.44],
    growth: [0.05, 0.13],
    leverage: [2.0, 3.8],
    capexRate: [0.16, 0.28],
    priceToBook: [1.5, 2.8],
    peerEvEbitda: { low: 6, high: 9.5 },
    peerForwardPe: { low: 13, high: 19 },
    peerSetNote:
      "Fibre and data centre operators benchmarked on EV/EBITDA given differing depreciation policies.",
  },
};

/** Three actual years then two forecast years, relative to the 2026 pipeline. */
const YEAR_LABELS = ["2023", "2024", "2025", "2026E", "2027E"];
const PROJECTED_FROM_INDEX = 3;

/* -------------------------------------------------------------- generation */

export function buildFinancials(args: {
  id: string;
  sector: SectorCode;
  status: IpoStatus;
  currency: string;
  /** Expected equity value in local currency, or null if undisclosed. */
  equityValue: number | null;
  /** Fallback scale when no valuation is disclosed, in local currency. */
  fallbackScale: number;
}): Financials | null {
  const { id, sector, status, currency, equityValue, fallbackScale } = args;

  // A rumoured listing with no disclosed valuation has not lodged a
  // prospectus, so there is no financial disclosure to read. Leaving these
  // null is more honest than inventing a filing that does not exist.
  if (status === "rumoured" && equityValue === null) return null;

  const rng = makeRng(seedFrom(id));
  const profile = PROFILES[sector];

  // Sizing basis: the real valuation where disclosed, otherwise a plausible
  // scale so the statements still exist without implying a price.
  const basis = equityValue ?? fallbackScale;

  const margin = between(rng, ...profile.ebitdaMargin);
  const leverage = between(rng, ...profile.leverage);
  const growth = between(rng, ...profile.growth);
  const capexRate = between(rng, ...profile.capexRate);
  const priceToBook = between(rng, ...profile.priceToBook);

  let revenueFinal: number;
  let ebitdaFinal: number;
  let netDebt: number;

  if (profile.lossMaking) {
    // Pre-profit: modest collaboration revenue against a cash burn, and a net
    // cash position from the raise rather than borrowings.
    revenueFinal = basis * between(rng, 0.012, 0.045);
    ebitdaFinal = -basis * between(rng, 0.03, 0.065);
    netDebt = -basis * between(rng, 0.06, 0.14);
  } else {
    // Work backwards from the peer multiple: EV = equity + net debt, and
    // EV = EBITDA x multiple, with net debt itself a multiple of EBITDA.
    // Solving gives EBITDA = equity / (evMultiple - leverage).
    // Drawn from a band wider than the peer range, so a minority of deals
    // price at a discount or a premium to their comparables. Sampling strictly
    // inside the range would make every single listing read "within peers",
    // which is not how books get built.
    const evMultiple = between(
      rng,
      profile.peerEvEbitda.low * 0.84,
      profile.peerEvEbitda.high * 1.16,
    );
    const denominator = Math.max(evMultiple - leverage, 2.5);
    ebitdaFinal = basis / denominator;
    revenueFinal = ebitdaFinal / margin;
    netDebt = ebitdaFinal * leverage;
  }

  // Grow the final year backwards into a history. Growth eases slightly in the
  // forecast years, which is how projections are usually presented.
  const years: FinancialYear[] = [];
  let revenue = revenueFinal;

  for (let i = YEAR_LABELS.length - 1; i >= 0; i--) {
    const projected = i >= PROJECTED_FROM_INDEX;
    // Margin expands modestly over time; earlier years sit below the target.
    const yearMargin = margin * (1 - (YEAR_LABELS.length - 1 - i) * 0.035);
    const ebitda = profile.lossMaking
      ? ebitdaFinal * Math.pow(0.86, YEAR_LABELS.length - 1 - i)
      : revenue * yearMargin;

    const conversion = profile.lossMaking
      ? between(rng, ...profile.netIncomeConversion)
      : between(rng, ...profile.netIncomeConversion) *
        (1 - (YEAR_LABELS.length - 1 - i) * 0.03);

    years.unshift({
      label: YEAR_LABELS[i],
      projected,
      revenue: sig(revenue),
      ebitda: sig(ebitda),
      netIncome: sig(ebitda * conversion),
    });

    const yearGrowth = projected ? growth : growth * between(rng, 0.85, 1.15);
    revenue = revenue / (1 + yearGrowth);
  }

  const finalYear = years[years.length - 1];
  const latestActual = years[PROJECTED_FROM_INDEX - 1];

  const totalEquity = basis / priceToBook;
  const tangibleEquity = totalEquity * between(rng, 0.62, 0.94);
  const totalAssets = totalEquity + Math.max(netDebt, 0) + totalEquity * between(rng, 0.35, 0.9);
  const operatingCashFlow = latestActual.ebitda * between(rng, 0.74, 0.95);
  const freeCashFlow = operatingCashFlow - latestActual.revenue * capexRate;

  const enterpriseValue = equityValue === null ? null : equityValue + netDebt;

  const benchmark = {
    peerForwardPe: profile.lossMaking ? null : profile.peerForwardPe,
    peerEvEbitda: profile.lossMaking ? null : profile.peerEvEbitda,
    impliedForwardPe:
      equityValue !== null && finalYear.netIncome > 0
        ? Math.round((equityValue / finalYear.netIncome) * 10) / 10
        : null,
    impliedEvEbitda:
      enterpriseValue !== null && finalYear.ebitda > 0
        ? Math.round((enterpriseValue / finalYear.ebitda) * 10) / 10
        : null,
    impliedPriceSales:
      equityValue !== null && finalYear.revenue > 0
        ? Math.round((equityValue / finalYear.revenue) * 10) / 10
        : null,
    peerSetNote: profile.peerSetNote,
    notMeaningfulNote: profile.lossMaking
      ? "Pre-profit. Earnings and EBITDA multiples are not meaningful at this stage; the peer set is benchmarked on risk-adjusted pipeline value and price to book instead."
      : equityValue === null
        ? "No valuation range has been signalled, so implied multiples cannot be calculated. Peer ranges are shown for reference."
        : null,
  };

  return {
    currency,
    years,
    balanceSheet: {
      totalAssets: sig(totalAssets),
      totalEquity: sig(totalEquity),
      tangibleEquity: sig(tangibleEquity),
      netDebt: sig(netDebt),
      operatingCashFlow: sig(operatingCashFlow),
      freeCashFlow: sig(freeCashFlow),
    },
    benchmark,
    enterpriseValue: enterpriseValue === null ? null : sig(enterpriseValue),
  };
}
