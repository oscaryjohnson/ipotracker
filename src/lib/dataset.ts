import { EXCHANGES, toUsd } from "@/data/exchanges";
import { buildFinancials, seededScale } from "@/data/financials";
import { RAW_IPOS, type RawIpo } from "@/data/ipos";
import type { Contact, IpoRecord } from "@/lib/types";

/**
 * Normalisation layer.
 *
 * Raw records carry local-currency amounts and no source attribution; this
 * converts valuations to USD for cross-exchange sorting and attaches each
 * record's provenance from the exchange table. In a live build this is exactly
 * where scraper output would land before reaching the UI.
 */

function contact(
  name: string | null,
  email: string | null,
  provenance: Contact["emailProvenance"],
  note: string | undefined,
): Contact {
  return { name, email, emailProvenance: provenance, emailNote: note };
}

function normalise(raw: RawIpo): IpoRecord {
  const meta = EXCHANGES[raw.exchange];

  // Companies that never signalled a valuation still have a prospectus to
  // read, so size them from a stable per-company scale expressed in USD and
  // converted into the local currency the statements are reported in.
  const fallbackScale = seededScale(raw.id, 320_000_000, 2_400_000_000) / meta.usdRate;

  return {
    id: raw.id,
    companyName: raw.companyName,
    exchange: raw.exchange,
    expectedListingDate: raw.expectedListingDate,
    dateConfidence: raw.dateConfidence,
    sector: raw.sector,
    businessDescription: raw.businessDescription,
    expectedValuation:
      raw.valuationLocal === null
        ? null
        : {
            currency: meta.currency,
            localAmount: raw.valuationLocal,
            usdAmount: toUsd(raw.valuationLocal, raw.exchange),
          },
    ceo: contact(
      raw.ceoName,
      raw.ceoEmail,
      raw.ceoEmailProvenance,
      raw.ceoEmailNote,
    ),
    cfo: contact(
      raw.cfoName,
      raw.cfoEmail,
      raw.cfoEmailProvenance,
      raw.cfoEmailNote,
    ),
    website: raw.website,
    status: raw.status,
    sourceRef: {
      tier: meta.productionSource.tier,
      label: meta.productionSource.label,
      url: meta.productionSource.url,
      lastVerified: raw.lastVerified,
    },
    financials: buildFinancials({
      id: raw.id,
      sector: raw.sector,
      status: raw.status,
      currency: meta.currency,
      equityValue: raw.valuationLocal,
      fallbackScale,
    }),
  };
}

/** The full normalised dataset. */
export const IPOS: IpoRecord[] = RAW_IPOS.map(normalise);

/** Headline figures for the summary tiles. */
export interface DatasetStats {
  total: number;
  exchangeCount: number;
  /** Combined expected valuation in USD, across records that disclose one. */
  totalValuationUsd: number;
  /** How many records disclose a valuation at all. */
  valuationDisclosed: number;
  /** Listings dated within the next 30 days. */
  listingsNext30Days: number;
}

export function computeStats(records: IpoRecord[], now = new Date()): DatasetStats {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 30);

  let totalValuationUsd = 0;
  let valuationDisclosed = 0;
  let listingsNext30Days = 0;
  const exchanges = new Set<string>();

  for (const record of records) {
    exchanges.add(record.exchange);

    if (record.expectedValuation) {
      totalValuationUsd += record.expectedValuation.usdAmount;
      valuationDisclosed += 1;
    }

    if (record.expectedListingDate) {
      const date = new Date(record.expectedListingDate);
      if (date >= now && date <= horizon) listingsNext30Days += 1;
    }
  }

  return {
    total: records.length,
    exchangeCount: exchanges.size,
    totalValuationUsd,
    valuationDisclosed,
    listingsNext30Days,
  };
}
