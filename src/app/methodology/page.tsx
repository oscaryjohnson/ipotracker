import Link from "next/link";
import type { Metadata } from "next";
import { EXCHANGES, EXCHANGE_CODES } from "@/data/exchanges";
import { IPOS } from "@/lib/dataset";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { SourceTier } from "@/lib/types";

export const metadata: Metadata = {
  title: "Data & Methodology — Global IPO Pipeline",
  description:
    "Where this dashboard's data would come from in production, why the dataset is a demonstration, and how contact confidence is graded.",
};

const TIER_LABEL: Record<SourceTier, string> = {
  "structured-feed": "Structured feed",
  "html-scrape": "HTML scrape",
  "pdf-extract": "PDF extraction",
  "vendor-api": "Vendor API",
};

/** Ingestion difficulty, shown as a three-step scale. */
const TIER_DIFFICULTY: Record<SourceTier, number> = {
  "structured-feed": 1,
  "html-scrape": 2,
  "pdf-extract": 3,
  "vendor-api": 1,
};

const API_FINDINGS = [
  {
    provider: "Finnhub",
    endpoint: "/calendar/ipo",
    free: "Yes — 60 req/min",
    coverage: "US listings only",
    url: "https://finnhub.io/docs/api/ipo-calendar",
  },
  {
    provider: "Alpha Vantage",
    endpoint: "IPO_CALENDAR",
    free: "Yes — 25 req/day",
    coverage: "US, next 3 months",
    url: "https://www.alphavantage.co/premium/",
  },
  {
    provider: "Financial Modeling Prep",
    endpoint: "IPO calendar",
    free: "Legacy tier, 250/day",
    coverage: "Mostly US; non-US behind paid plans",
    url: "https://site.financialmodelingprep.com/developer/docs/stable/ipos-calendar",
  },
  {
    provider: "EODHD / Polygon / Intrinio",
    endpoint: "IPO calendar",
    free: "No",
    coverage: "Paid tiers only, ~$50–200/mo",
    url: "https://eodhd.com/financial-apis/",
  },
];

/**
 * Where prospectus financials and peer multiples would be read from in a live
 * build. Ordered roughly by how much of the work each one does.
 */
const FINANCIAL_SOURCES = [
  {
    name: "SEC EDGAR — S-1 prospectus",
    access: "Free",
    url: "https://www.sec.gov/edgar/searchedgar/companysearch",
    note: "The registration statement carries audited historical financials, the capitalisation table, use of proceeds and the pre-IPO valuation. Machine-readable and free, but only covers US-listed offerings — none of our eleven exchanges. Useful as the model for what a filing contains.",
  },
  {
    name: "LSE admission documents and RNS filings",
    access: "Free",
    url: "https://www.londonstockexchange.com/news",
    note: "The direct equivalent for London: admission documents carry the historical financial information table, and RNS announcements carry intention-to-float and pricing statements. Each non-US exchange has its own analogue — SENS for the JSE, MOPS for Taiwan, CVM filings for Brazil.",
  },
  {
    name: "Comparable company multiples from listed peers",
    access: "Free to derive",
    url: "https://abramsvaluation.com/blog/ipo-pricing-methods/",
    note: "Peer P/E, EV/EBITDA and price/sales are computed from public market data rather than obtained from a vendor. This is what the peer ranges in the benchmarking panel represent, and it is the one input a free pipeline can genuinely reproduce.",
  },
  {
    name: "Damodaran / NYU Stern valuation datasets",
    access: "Free",
    url: "https://www.stern.nyu.edu/sites/default/files/assets/documents/con_043273.pdf",
    note: "Published sector margin, multiple and cost-of-capital datasets, useful for sanity-checking peer ranges and for sectors where the local listed peer set is too thin to be meaningful.",
  },
  {
    name: "Bloomberg / Capital IQ",
    access: "Paid",
    url: null,
    note: "Normalised financials and peer screens across every market in one interface. This is what a professional desk actually uses, and it removes most of the eleven-integration problem — at institutional subscription cost.",
  },
  {
    name: "Renaissance Capital",
    access: "Paid",
    url: "https://www.renaissancecapital.com/IPO-Center/Calendar",
    note: "IPO-specific research covering the window after a prospectus is filed but before trading begins, which is exactly the window this dashboard tracks. Strong on US and Europe, thinner on the Gulf and Southeast Asia.",
  },
];

function Difficulty({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`${level} of 3`}>
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={`inline-block h-1 w-3 rounded-[1px] ${
            step <= level ? "bg-text-muted" : "bg-line"
          }`}
        />
      ))}
    </span>
  );
}

export default function MethodologyPage() {
  const sourceCounts = EXCHANGE_CODES.reduce<Record<SourceTier, number>>(
    (acc, code) => {
      const tier = EXCHANGES[code].productionSource.tier;
      acc[tier] = (acc[tier] ?? 0) + 1;
      return acc;
    },
    {} as Record<SourceTier, number>,
  );

  const missingDates = IPOS.filter((r) => !r.expectedListingDate).length;
  const missingValuations = IPOS.filter((r) => !r.expectedValuation).length;
  const missingCfo = IPOS.filter((r) => !r.cfo.name).length;
  const contacts = IPOS.flatMap((r) => [r.ceo, r.cfo]);
  const verified = contacts.filter(
    (c) => c.emailProvenance === "verified",
  ).length;
  const inferred = contacts.filter(
    (c) => c.emailProvenance === "inferred",
  ).length;
  const unavailable = contacts.filter(
    (c) => c.emailProvenance === "unavailable",
  ).length;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 text-[12px] text-text-muted transition-colors hover:border-line-strong hover:text-text"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
              <path
                d="M7.5 2.5L4 6l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </Link>
          <h1 className="flex items-center gap-2 text-[14px] font-semibold text-text">
            <Logo size={17} className="shrink-0" />
            Data &amp; Methodology
          </h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <section className="mb-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text">
            Why this dataset is a demonstration
          </h2>
          <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-text-muted">
            <p>
              Every company in this dashboard is fictional. That is a deliberate
              engineering decision, and this page is the reasoning behind it.
            </p>
            <p>
              There is no free API that covers the IPO pipelines of these eleven
              exchanges. Every free IPO calendar endpoint on the market is
              US-only. Real coverage of London, Warsaw, Dubai, Riyadh,
              Johannesburg, São Paulo, Singapore, Taipei, Bangkok, Kuala Lumpur
              and Frankfurt means reading each exchange&apos;s own publications —
              which range from a clean machine-readable spreadsheet at the LSE to
              Arabic-first prospectus PDFs at Tadawul and the DFM.
            </p>
            <p>
              Rather than scrape a partial snapshot and present it as live data,
              this dataset models the exact shape a production pipeline would
              emit — including its gaps — and documents, per exchange, precisely
              where each record would be drawn from. The interface, filtering,
              sorting and export logic are all real and operate on{" "}
              {IPOS.length} records.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text">
            Free API research
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-text-muted">
            What is actually obtainable without a commercial contract:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="py-2 pr-4 text-[10.5px] font-medium uppercase tracking-[0.09em] text-text-muted">
                    Provider
                  </th>
                  <th className="py-2 pr-4 text-[10.5px] font-medium uppercase tracking-[0.09em] text-text-muted">
                    Endpoint
                  </th>
                  <th className="py-2 pr-4 text-[10.5px] font-medium uppercase tracking-[0.09em] text-text-muted">
                    Free tier
                  </th>
                  <th className="py-2 text-[10.5px] font-medium uppercase tracking-[0.09em] text-text-muted">
                    Coverage
                  </th>
                </tr>
              </thead>
              <tbody>
                {API_FINDINGS.map((row) => (
                  <tr key={row.provider} className="border-b border-line">
                    <td className="py-2.5 pr-4">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text underline decoration-line-strong underline-offset-2 hover:decoration-text-muted"
                      >
                        {row.provider}
                      </a>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-text-muted">
                      {row.endpoint}
                    </td>
                    <td className="py-2.5 pr-4 text-text-muted">{row.free}</td>
                    <td className="py-2.5 text-text-muted">{row.coverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-text-faint">
            Conclusion: the free options cover none of the eleven target
            exchanges. Production coverage means either official exchange
            sources (free, eleven separate integrations) or a commercial
            aggregator (paid, single integration).
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text">
            Per-exchange sourcing plan
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-text-muted">
            Where each exchange&apos;s records would genuinely come from, and what
            it costs to ingest.{" "}
            {sourceCounts["structured-feed"] ?? 0} exchange provides a structured
            feed, {sourceCounts["html-scrape"] ?? 0} are scrapable HTML, and{" "}
            {sourceCounts["pdf-extract"] ?? 0} require PDF extraction.
          </p>

          <div className="mt-5 space-y-3">
            {EXCHANGE_CODES.map((code) => {
              const meta = EXCHANGES[code];
              const tier = meta.productionSource.tier;
              return (
                <div
                  key={code}
                  className="rounded-sm border border-line bg-surface p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-[13px] font-medium text-text">
                      {meta.name}
                    </h3>
                    <span className="text-[11px] uppercase tracking-[0.06em] text-text-faint">
                      {meta.city} · {meta.currency}
                    </span>
                    <div className="ml-auto flex items-center gap-2.5">
                      <span className="text-[10.5px] uppercase tracking-[0.08em] text-text-muted">
                        {TIER_LABEL[tier]}
                      </span>
                      <Difficulty level={TIER_DIFFICULTY[tier]} />
                    </div>
                  </div>

                  <a
                    href={meta.productionSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[12.5px] text-text underline decoration-line-strong underline-offset-2 hover:decoration-text-muted"
                  >
                    {meta.productionSource.label}
                  </a>

                  <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-text-muted">
                    {meta.productionSource.acquisitionNote}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text">
            Financial data and valuation multiples
          </h2>
          <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-text-muted">
            <p>
              The Financials tab on each row carries an income statement
              (three actual years and two forecast years), a balance sheet and
              cash flow summary including tangible book value, and the
              underwriter&apos;s valuation benchmarking.
            </p>
            <p>
              These figures are generated rather than hand-written, and
              generated in the direction a real deal works: the expected
              valuation and the sector&apos;s peer multiples together imply an
              EBITDA, which implies revenue, which is grown backwards into a
              history. The consequence is that the numbers are internally
              consistent — the implied EV/EBITDA shown really is enterprise
              value divided by the projected EBITDA displayed beside it, and
              enterprise value really is equity value plus net debt. The
              arithmetic holds if you check it.
            </p>
            <p>
              Each of the eleven sectors carries its own margin, leverage,
              capital intensity and peer-multiple profile, so a REIT reads like
              a REIT and a clinical-stage biotech reads like one — pre-revenue,
              loss-making, with earnings multiples marked not meaningful rather
              than fabricated.
            </p>
          </div>

          <h3 className="mt-6 text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Where these would come from in production
          </h3>
          <ul className="mt-3 space-y-2.5">
            {FINANCIAL_SOURCES.map((source) => (
              <li key={source.name} className="flex gap-3">
                <span className="mt-[7px] inline-block h-1 w-3 shrink-0 rounded-[1px] bg-line-strong" />
                <div>
                  <div className="text-[12.5px] font-medium text-text">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-line-strong underline-offset-2 hover:decoration-text-muted"
                      >
                        {source.name}
                      </a>
                    ) : (
                      source.name
                    )}
                    <span className="ml-2 text-[10.5px] uppercase tracking-[0.08em] text-text-faint">
                      {source.access}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-text-muted">
                    {source.note}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text">
            How contact confidence is graded
          </h2>
          <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-text-muted">
            <p>
              Executive names are genuinely obtainable in production — prospectus
              management sections, company leadership pages, and listing press
              releases all name the CEO and CFO. Personal corporate email
              addresses for executives at pre-IPO companies are almost never
              published.
            </p>
            <p>
              The common shortcut is to guess{" "}
              <span className="font-mono text-[12.5px] text-text">
                firstname.lastname@company.com
              </span>{" "}
              and present it as data. This dashboard refuses to do that silently.
              Every address carries one of three grades, shown in the UI:
            </p>
          </div>

          <dl className="mt-5 space-y-4">
            <div className="flex gap-3">
              <span className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />
              <div>
                <dt className="text-[12.5px] font-medium text-text">
                  Verified — {verified} of {contacts.length} contact slots
                </dt>
                <dd className="mt-0.5 text-[12.5px] leading-relaxed text-text-muted">
                  A published address. In practice these are investor relations
                  and press desks, which are real, findable, and the correct
                  route to a listed company&apos;s leadership.
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
              <div>
                <dt className="text-[12.5px] font-medium text-text">
                  Inferred — {inferred} of {contacts.length}
                </dt>
                <dd className="mt-0.5 text-[12.5px] leading-relaxed text-text-muted">
                  Derived from a confirmed company domain pattern and{" "}
                  <em>not</em> confirmed. Usable as a lead; never presented as
                  fact.
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-text-faint" />
              <div>
                <dt className="text-[12.5px] font-medium text-text">
                  Unavailable — {unavailable} of {contacts.length}
                </dt>
                <dd className="mt-0.5 text-[12.5px] leading-relaxed text-text-muted">
                  No defensible basis for an address. Rendered as N/A with the
                  reason attached, rather than filled with a guess.
                </dd>
              </div>
            </div>
          </dl>
        </section>

        <section className="mb-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text">
            Missing data
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-text-muted">
            Gaps are seeded to match what a real pipeline encounters, so the
            dashboard&apos;s handling of them is exercised rather than asserted.
            Of {IPOS.length} records: {missingDates} have no announced listing
            date, {missingValuations} disclose no valuation, and {missingCfo}{" "}
            have no CFO named in public filings. Two rumoured-stage listings are
            near-empty by design.
          </p>
          <p className="mt-3 text-[13.5px] leading-relaxed text-text-muted">
            Missing values render as N/A with an explanatory tooltip, and always
            sort to the bottom regardless of sort direction — an unknown
            valuation is not a small one, and burying it keeps the useful rows
            in view.
          </p>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text">
            Implementation
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-text-muted">
            Next.js static export with TypeScript and Tailwind, deployed as a
            fully static site. The dataset is normalised at build time —
            local-currency valuations converted to USD, exchange classifications
            mapped onto a single sector vocabulary — so the table is populated on
            first paint with no client fetch. Filtering, sorting, search, CSV
            export and bookmarking all run client-side against the in-memory
            dataset. In production, the scrapers described above would refresh
            the same normalised file on a schedule; nothing else would change.
          </p>
        </section>
      </main>
    </div>
  );
}
