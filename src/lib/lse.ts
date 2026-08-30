import raw from "@/data/generated/lse-live.json";

/**
 * Real LSE data, produced by `npm run ingest:lse`.
 *
 * This is the one part of the dashboard that is not a demonstration. It is
 * parsed from the London Stock Exchange's own monthly Main Market equity
 * factsheets and committed as a JSON artifact, so the site build never depends
 * on the LSE being reachable.
 *
 * Note what it is: completed admissions, not a forward pipeline. Companies
 * appear on the day they list. That is a real limitation of the source rather
 * than of the adapter -- upcoming listings are announced via RNS, which is a
 * separate and far less structured feed.
 */

export interface LseAdmission {
  admissionDate: string;
  issuerName: string;
  symbol: string | null;
  /** Every ticker for this issuer where a company has multiple share classes. */
  symbols: string[];
  instrumentCount: number;
  issueType: string | null;
  /** The LSE's own IPO flag. Transfers and takeovers are admissions, not IPOs. */
  isIpo: boolean;
  icbSector: string | null;
  countryOfIncorporation: string | null;
  marketCapAtAdmission: number | null;
  moneyRaised: number | null;
  /** Which monthly factsheet this row came from. */
  period: string;
  sourceUrl: string;
}

export interface LseDataset {
  source: string;
  sourceIndexUrl: string;
  fetchedAt: string;
  latestPeriod: string;
  dataDescription: string;
  summary: {
    year: number;
    companiesUk: number;
    companiesInternational: number;
    companiesTotal: number;
  } | null;
  files: { period: string; url: string; issueCount: number }[];
  issues: LseAdmission[];
}

export const LSE_DATA = raw as LseDataset;

/** Admissions the LSE itself flags as IPOs, newest first. */
export const LSE_IPOS = LSE_DATA.issues.filter((issue) => issue.isIpo);

export interface LseStats {
  admissions: number;
  ipos: number;
  /** Combined market cap at admission, £m, across rows that report one. */
  totalMarketCap: number;
  totalRaised: number;
  years: number[];
}

export function lseStats(rows: LseAdmission[]): LseStats {
  let totalMarketCap = 0;
  let totalRaised = 0;
  const years = new Set<number>();

  for (const row of rows) {
    if (row.marketCapAtAdmission) totalMarketCap += row.marketCapAtAdmission;
    if (row.moneyRaised) totalRaised += row.moneyRaised;
    years.add(Number(row.admissionDate.slice(0, 4)));
  }

  return {
    admissions: rows.length,
    ipos: rows.filter((r) => r.isIpo).length,
    totalMarketCap: Math.round(totalMarketCap),
    totalRaised: Math.round(totalRaised * 10) / 10,
    years: [...years].sort((a, b) => b - a),
  };
}

/** "£1.18bn" / "£492m" / "£8.8m" from a figure already denominated in £m. */
export function formatGbpMillions(value: number | null): string {
  if (value === null) return "N/A";
  if (value === 0) return "£0";
  if (value >= 1000) return `£${(value / 1000).toFixed(2)}bn`;
  if (value >= 10) return `£${Math.round(value)}m`;
  return `£${value.toFixed(1)}m`;
}
