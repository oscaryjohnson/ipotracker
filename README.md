# Global IPO Pipeline

A live dashboard tracking upcoming IPO listings across eleven global exchanges —
London, Warsaw, Dubai, Riyadh, Johannesburg, São Paulo, Singapore, Taipei,
Bangkok, Kuala Lumpur and Frankfurt.

## What it does

- **70 listings across all 11 target exchanges**, with company, exchange,
  expected listing date, sector, business description, expected valuation, and
  CEO/CFO names and contact details.
- **Search** across company names, executives, descriptions and email addresses.
- **Filter** by exchange and sector (multi-select, with per-option counts).
- **Sortable columns** — company, exchange, listing date, sector, valuation.
- **Expandable rows** with two tabs: an Overview carrying the description and
  full contacts, and a Financials tab carrying prospectus financials and
  underwriter valuation benchmarking.
- **CSV export** of the currently filtered view (32 columns).
- **Bookmarking** via browser storage, with a saved-only filter.
- **Copy-to-clipboard** on every email address.
- **Light and dark themes**, persisted, with no flash on load.

## A note on the data

**Every company in this dashboard is fictional.** This is a deliberate
engineering decision, documented in full on the `/methodology` page.

There is no free API covering the IPO pipelines of these eleven exchanges —
every free IPO calendar endpoint (Finnhub, Alpha Vantage, FMP) is US-only. Real
coverage means reading each exchange's own publications, which range from a
clean machine-readable spreadsheet at the LSE to Arabic-first prospectus PDFs at
Tadawul and the DFM.

Rather than scrape a partial snapshot and present it as live data, this dataset
models the shape a production pipeline would emit — including its gaps — and
documents, per exchange, exactly where each record would be drawn from. The
interface, filtering, sorting and export logic are all real.

Two consequences worth knowing:

- **Contact confidence is graded.** Every email is marked `verified` (a
  published IR desk), `inferred` (pattern-derived from a company domain, and
  explicitly not confirmed) or `unavailable` (rendered N/A with the reason).
  Guessed addresses are never presented as verified.
- **Financials are internally consistent.** They are derived in the direction a
  real deal works: expected valuation and sector peer multiples imply an EBITDA,
  which implies revenue, which grows backwards into a history. The implied
  EV/EBITDA shown really is enterprise value divided by the projected EBITDA
  beside it. The arithmetic holds if you check it.
- **Financial disclosure is gated on pipeline status**, because availability
  genuinely differs. The 47 filed and approved companies have a prospectus, so
  they show full statements plus forecasts and underwriter peer benchmarking.
  The 7 rumoured companies in jurisdictions with a public accounts register
  (UK, Germany, Poland) show history only — no forecasts, no multiples, because
  no bank has analysed a deal that does not formally exist. The remaining 16
  show nothing at all.

Gaps are seeded deliberately so the missing-data handling is exercised rather
than asserted: 11 listings have no announced date, 11 disclose no valuation, and
16 name no CFO. Fiscal year ends vary by market rather than defaulting to
December everywhere.

## Stack

Next.js 16 (static export) · TypeScript · Tailwind CSS 4. No backend, no
database, no API keys. The dataset is normalised at build time — local-currency
valuations converted to USD, exchange classifications mapped onto one sector
vocabulary — so the table is populated on first paint with no client fetch.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

To produce the static build:

```bash
npm run build
```

Output lands in `out/` and can be served by any static host.

## Layout

```
src/
  app/            routes: dashboard, /methodology, icon
  components/     table, filters, detail tabs, logo, theme toggle
  data/           exchanges (+ production sourcing plan), sectors,
                  IPO records, financial generation
  lib/            types, normalisation, filtering/sorting, formatting, CSV
```

`src/data/exchanges.ts` carries the per-exchange production sourcing plan — the
real URL each exchange's records would come from, and an honest note on what it
costs to ingest.
