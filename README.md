# Global IPO Pipeline

A dashboard tracking upcoming IPO listings across eleven global exchanges: London,
Warsaw, Dubai, Riyadh, Johannesburg, São Paulo, Singapore, Taipei, Bangkok,
Kuala Lumpur and Frankfurt.

**Live:** https://ipotracker-blue.vercel.app/

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), exported as a fully static site |
| Language | TypeScript |
| Styling | Tailwind CSS 4, with CSS custom properties for theming |
| Data | Committed JSON/TS modules, baked in at build time |
| Ingestion | Node scripts using `exceljs` for spreadsheet parsing |
| Hosting | Vercel (any static host works) |

No backend, no database, no API keys. The dataset is normalised at build time and
shipped with the page, so the table is populated on first paint with no loading
state and nothing that can fail at request time.

---

## Using the dashboard

**Search** — the box matches company names, CEO and CFO names, business
descriptions and email addresses. Typing a surname finds their company.

**Filter** — Exchange and Sector are multi-select dropdowns showing a record
count beside each option. Combine them freely with search.

**Sort** — click any of Company, Exchange, Listing Date, Sector or Valuation.
Click again to reverse. Missing values always sort to the bottom, in both
directions, so undated or unvalued listings never crowd out the useful rows.

**Expand a row** — click anywhere on it. The row opens in place with two tabs:

- **Overview** — full business description, both executives with copy-to-clipboard
  emails, and the source the record came from
- **Financials** — income statement, balance sheet and cash flow, and the
  underwriter's valuation benchmarking

**Save companies** — the bookmark icon at the left of each row. Saved companies
persist in your browser; the "Saved" button filters to them.

**Export** — Export CSV downloads what you are currently looking at, filters
applied, not the whole dataset.

**Reset** — the Reset button, or clicking the title, clears search, filters and
sort and collapses open rows. Bookmarks survive.

**Theme** — the icon at top right toggles light and dark; your choice is
remembered.

### Other pages

- **Data & methodology** — where every record would be sourced in production,
  exchange by exchange, plus the free-API research behind the approach
- **LSE Live** — real admissions data parsed from the London Stock Exchange's
  own monthly factsheets

---

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build      # static build, output in out/
npm run ingest:lse # refresh the real LSE data
```

`ingest:lse` downloads the LSE's monthly Main Market factsheets, extracts the new
issues table from each, and writes `src/data/generated/lse-live.json`. That file
is committed, so the build never depends on the LSE being reachable. It refuses
to write an empty dataset — a parse returning nothing means the format changed,
not that the LSE stopped listing companies.

---

## Project layout

```
scripts/          ingestion adapters (currently: LSE)
src/app/          routes — dashboard, /methodology, /lse
src/components/   table, filters, detail tabs, theme toggle
src/data/         exchange reference data, sectors, IPO records, financials
src/lib/          types, normalisation, filtering, formatting, CSV
```

---

## A note on the data

The **LSE Live** page is real, parsed from official exchange files. The main
dashboard uses a **demonstration dataset** of 70 fictional companies, disclosed
on the page itself.

That is deliberate: no free API covers the IPO pipelines of these eleven
exchanges — every free IPO calendar endpoint is US-only. Rather than present a
partial scrape as live data, the dataset models the shape a real pipeline
produces, gaps included, and the methodology page documents exactly where each
record would come from.

Two things worth knowing:

- **Contact emails are graded** verified / inferred / unavailable. Guessed
  addresses are never shown as confirmed.
- **Financial disclosure is gated on filing status.** Companies with a
  prospectus show full statements and peer multiples; rumoured companies show
  history only where a public accounts register exists, and otherwise nothing.
