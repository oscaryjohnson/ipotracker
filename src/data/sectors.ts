import type { SectorCode } from "@/lib/types";

/**
 * Fixed sector taxonomy.
 *
 * Real exchanges each use their own classification (ICB on the LSE, GICS on
 * Tadawul, B3's own scheme, and so on). An ingestion pipeline would map those
 * onto a single vocabulary so the sector filter means the same thing across
 * every market -- this is that vocabulary.
 */
export interface SectorMeta {
  code: SectorCode;
  label: string;
  /** Source classifications this bucket would absorb during normalisation. */
  mapsFrom: string;
}

export const SECTORS: Record<SectorCode, SectorMeta> = {
  biotech: {
    code: "biotech",
    label: "Biotech",
    mapsFrom: "Biotechnology, Pharmaceuticals, Life Sciences Tools",
  },
  "ai-software": {
    code: "ai-software",
    label: "AI & Software",
    mapsFrom: "Software, IT Services, Semiconductors, Technology Hardware",
  },
  fintech: {
    code: "fintech",
    label: "FinTech",
    mapsFrom: "Financial Technology, Payments, Digital Banking, InsurTech",
  },
  energy: {
    code: "energy",
    label: "Energy",
    mapsFrom: "Oil & Gas, Renewables, Utilities, Energy Equipment",
  },
  "metals-mining": {
    code: "metals-mining",
    label: "Metals & Mining",
    mapsFrom: "Mining, Precious Metals, Steel, Basic Resources",
  },
  consumer: {
    code: "consumer",
    label: "Consumer",
    mapsFrom: "Retail, Food & Beverage, Household Goods, Leisure",
  },
  industrials: {
    code: "industrials",
    label: "Industrials",
    mapsFrom: "Machinery, Construction, Aerospace & Defence, Chemicals",
  },
  healthcare: {
    code: "healthcare",
    label: "Healthcare",
    mapsFrom: "Healthcare Providers, Medical Devices, Health Services",
  },
  "real-estate": {
    code: "real-estate",
    label: "Real Estate",
    mapsFrom: "REITs, Property Development, Real Estate Services",
  },
  logistics: {
    code: "logistics",
    label: "Logistics",
    mapsFrom: "Transport, Shipping, Warehousing, Delivery",
  },
  telecom: {
    code: "telecom",
    label: "Telecom",
    mapsFrom: "Telecommunications, Data Centres, Network Infrastructure",
  },
};

export const SECTOR_CODES = Object.keys(SECTORS) as SectorCode[];
