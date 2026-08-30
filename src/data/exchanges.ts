import type { ExchangeCode, SourceTier } from "@/lib/types";

/**
 * Exchange reference data, including the production sourcing plan.
 *
 * `productionSource` records where this exchange's IPO pipeline would actually
 * be read from in a live build, and `acquisitionNote` records the practical
 * difficulty. No free API covers this set of exchanges -- the free IPO calendar
 * endpoints (Finnhub, Alpha Vantage) are US-only -- so a real implementation
 * reads official exchange publications directly. This table is the audit trail
 * for that decision.
 */
export interface ExchangeMeta {
  code: ExchangeCode;
  name: string;
  shortName: string;
  city: string;
  country: string;
  countryCode: string;
  currency: string;
  /** Approximate local-currency -> USD rate used for cross-exchange sorting. */
  usdRate: number;
  /**
   * Whether private companies in this jurisdiction file annual accounts on a
   * public register.
   *
   * This decides what a pre-filing company can honestly show. In the UK,
   * Germany and Poland, statutory accounts are public before any prospectus
   * exists, so historical revenue and balance sheet are genuinely obtainable
   * for a rumoured listing. Elsewhere in this set they are not, and a rumoured
   * company should show nothing at all.
   */
  statutoryAccountsSource: string | null;
  productionSource: {
    tier: SourceTier;
    label: string;
    url: string;
    /** Honest assessment of what it takes to ingest this one. */
    acquisitionNote: string;
  };
}

export const EXCHANGES: Record<ExchangeCode, ExchangeMeta> = {
  LSE: {
    code: "LSE",
    name: "London Stock Exchange",
    shortName: "LSE",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    currency: "GBP",
    usdRate: 1.27,
    statutoryAccountsSource: "Companies House annual accounts",
    productionSource: {
      tier: "structured-feed",
      label: "LSE - New Issues and IPOs (official XLSX)",
      url: "https://docs.londonstockexchange.com/sites/default/files/reports/New%20issues%20and%20IPOs_2.xlsx",
      acquisitionNote:
        "Best case of the eleven. The LSE publishes a machine-readable spreadsheet of new issues and the IPO pipeline. Free, official, and parseable with a single XLSX read - no scraping required.",
    },
  },
  WSE: {
    code: "WSE",
    name: "Warsaw Stock Exchange (GPW)",
    shortName: "WSE",
    city: "Warsaw",
    country: "Poland",
    countryCode: "PL",
    currency: "PLN",
    usdRate: 0.25,
    statutoryAccountsSource: "KRS financial documents repository",
    productionSource: {
      tier: "html-scrape",
      label: "GPW - New listings and debuts",
      url: "https://www.gpw.pl/new-listings",
      acquisitionNote:
        "GPW publishes debut announcements in a consistent HTML table. Straightforward to scrape; some detail pages are Polish-only and need translation for the business description field.",
    },
  },
  DFM: {
    code: "DFM",
    name: "Dubai Financial Market",
    shortName: "DFM",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    currency: "AED",
    usdRate: 0.2723,
    statutoryAccountsSource: null,
    productionSource: {
      tier: "pdf-extract",
      label: "DFM - Disclosures and IPO prospectuses",
      url: "https://www.dfm.ae/issuers/listed-securities/ipo",
      acquisitionNote:
        "No structured feed. Offerings surface as prospectus PDFs and press releases, frequently bilingual. Requires PDF text extraction plus a parsing layer - the most expensive exchange in this set to ingest reliably.",
    },
  },
  TADAWUL: {
    code: "TADAWUL",
    name: "Saudi Exchange (Tadawul)",
    shortName: "Tadawul",
    city: "Riyadh",
    country: "Saudi Arabia",
    countryCode: "SA",
    currency: "SAR",
    usdRate: 0.2666,
    statutoryAccountsSource: null,
    productionSource: {
      tier: "pdf-extract",
      label: "Saudi Exchange - Upcoming listings and CMA approvals",
      url: "https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/issuer-news",
      acquisitionNote:
        "Two sources need joining: CMA offering approvals and the exchange's own listing notices. Both are announcement-driven and largely PDF. Arabic-first publication means the English version sometimes lags by days.",
    },
  },
  JSE: {
    code: "JSE",
    name: "Johannesburg Stock Exchange",
    shortName: "JSE",
    city: "Johannesburg",
    country: "South Africa",
    countryCode: "ZA",
    currency: "ZAR",
    usdRate: 0.055,
    statutoryAccountsSource: null,
    productionSource: {
      tier: "html-scrape",
      label: "JSE - SENS announcements and new listings",
      url: "https://www.jse.co.za/current-companies/new-listings",
      acquisitionNote:
        "The SENS announcement service is the authoritative channel and is semi-structured. Listing intentions are reliably announced there, but pre-listing statements arrive as attachments requiring extraction.",
    },
  },
  B3: {
    code: "B3",
    name: "B3 - Brasil Bolsa Balcao",
    shortName: "B3",
    city: "Sao Paulo",
    country: "Brazil",
    countryCode: "BR",
    currency: "BRL",
    usdRate: 0.183,
    statutoryAccountsSource: null,
    productionSource: {
      tier: "html-scrape",
      label: "B3 / CVM - Public offerings under review",
      url: "https://www.b3.com.br/en_us/products-and-services/solutions-for-issuers/ipo/",
      acquisitionNote:
        "The CVM registry of offerings under review is the real pipeline signal and is more structured than B3's own pages. Portuguese-language; company descriptions need translation.",
    },
  },
  SGX: {
    code: "SGX",
    name: "Singapore Exchange",
    shortName: "SGX",
    city: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    currency: "SGD",
    usdRate: 0.742,
    statutoryAccountsSource: null,
    productionSource: {
      tier: "html-scrape",
      label: "SGX - IPO prospectus index (OPERA)",
      url: "https://www.sgx.com/securities/ipo-prospectus",
      acquisitionNote:
        "Clean, English-language, consistently structured. The catch is timing: it is prospectus-driven, so a company only appears once it lodges - earlier-stage intentions are invisible here.",
    },
  },
  TWSE: {
    code: "TWSE",
    name: "Taiwan Stock Exchange",
    shortName: "TWSE",
    city: "Taipei",
    country: "Taiwan",
    countryCode: "TW",
    currency: "TWD",
    usdRate: 0.0312,
    statutoryAccountsSource: null,
    productionSource: {
      tier: "html-scrape",
      label: "TWSE - Newly listed companies / MOPS filings",
      url: "https://www.twse.com.tw/en/listed/newlisting.html",
      acquisitionNote:
        "TWSE publishes listing approvals in a stable table, with the MOPS filing system behind it. The English pages carry less detail than the Chinese ones, so full coverage means parsing both.",
    },
  },
  SET: {
    code: "SET",
    name: "Stock Exchange of Thailand",
    shortName: "SET",
    city: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    currency: "THB",
    usdRate: 0.0286,
    statutoryAccountsSource: null,
    productionSource: {
      tier: "html-scrape",
      label: "SET - Upcoming IPOs and new securities",
      url: "https://www.set.or.th/en/market/product/stock/ipo",
      acquisitionNote:
        "SET runs one of the better upcoming-IPO pages in the region, with subscription dates and offer prices in a real table. English coverage is good; SEC Thailand filings fill the gaps.",
    },
  },
  KLSE: {
    code: "KLSE",
    name: "Bursa Malaysia",
    shortName: "Bursa",
    city: "Kuala Lumpur",
    country: "Malaysia",
    countryCode: "MY",
    currency: "MYR",
    usdRate: 0.222,
    statutoryAccountsSource: null,
    productionSource: {
      tier: "html-scrape",
      label: "Bursa Malaysia - IPO Summary",
      url: "https://www.bursamalaysia.com/listing/listing_resources/ipo/ipo_summary",
      acquisitionNote:
        "Excellent source. A dedicated IPO summary table with listing dates, issue prices, and prospectus links, all in English. Second only to the LSE feed for ease of ingestion.",
    },
  },
  XETRA: {
    code: "XETRA",
    name: "Deutsche Boerse Xetra",
    shortName: "Xetra",
    city: "Frankfurt",
    country: "Germany",
    countryCode: "DE",
    currency: "EUR",
    usdRate: 1.081,
    statutoryAccountsSource: "Bundesanzeiger annual accounts",
    productionSource: {
      tier: "html-scrape",
      label: "Deutsche Boerse - New admissions to trading",
      url: "https://www.deutsche-boerse-cash-market.com/dbcm-en/primary-market",
      acquisitionNote:
        "Deutsche Boerse posts admissions and IPO news in a consistent structure, backed by BaFin prospectus approvals. Reliable for confirmed listings, thinner on early-stage pipeline.",
    },
  },
};

export const EXCHANGE_CODES = Object.keys(EXCHANGES) as ExchangeCode[];

/** Convert a local-currency amount to USD using the exchange's rate. */
export function toUsd(amount: number, exchange: ExchangeCode): number {
  return Math.round(amount * EXCHANGES[exchange].usdRate);
}
