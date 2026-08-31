import Link from "next/link";
import type { Metadata } from "next";
import { LseLive } from "@/components/LseLive";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LSE_DATA } from "@/lib/lse";

export const metadata: Metadata = {
  title: "LSE Live — Global IPO Pipeline",
  description:
    "Real admissions data parsed from the London Stock Exchange's monthly Main Market equity factsheets.",
};

export default function LsePage() {
  const fetched = new Date(LSE_DATA.fetchedAt);

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
            LSE Live
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/methodology"
              className="hidden h-8 items-center rounded-sm border border-line bg-surface px-2.5 text-[12px] text-text-muted transition-colors hover:border-line-strong hover:text-text sm:inline-flex"
            >
              Data &amp; methodology
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <LseLive data={LSE_DATA} />

        <section className="mx-auto w-full max-w-4xl px-6 py-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text">
            What this is, and what it is not
          </h2>
          <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-text-muted">
            <p>
              Everything on this page is real. It is parsed from{" "}
              {LSE_DATA.files.length} monthly Main Market equity factsheets
              published by the London Stock Exchange, covering{" "}
              {LSE_DATA.files[0]?.period} to {LSE_DATA.latestPeriod}. Every row
              links back to the factsheet it came from.
            </p>
            <p>
              <span className="font-medium text-text">
                These are completed admissions, not upcoming IPOs.
              </span>{" "}
              A company appears here on the day it lists. That is a limitation
              of the source, not of the adapter: the LSE does not publish a
              structured forward pipeline. Intention-to-float announcements go
              out through RNS, which is a news feed rather than a dataset, and
              is the natural next adapter to build.
            </p>
            <p>
              Note also how few of these admissions are actually IPOs. Most are
              transfers from AIM to the Main Market, introductions and reverse
              takeovers. The LSE flags genuine IPOs itself, and that flag is
              carried through rather than inferred — the &ldquo;IPOs only&rdquo;
              filter above uses it.
            </p>
          </div>

          <h3 className="mt-8 text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
            How it refreshes
          </h3>
          <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-text-muted">
            <p>
              The adapter runs on demand with{" "}
              <code className="rounded-sm bg-surface-2 px-1 py-0.5 font-mono text-[12px] text-text">
                npm run ingest:lse
              </code>
              . It downloads each monthly factsheet, extracts the New Issues
              table, collapses multiple share classes into one row per issuer,
              and writes a JSON artifact that is committed to the repository.
            </p>
            <p>
              The site reads that artifact at build time, so the deployed page
              never depends on the LSE being reachable, and a failed fetch can
              never blank the table. The ingest refuses to write an empty
              dataset for the same reason: a parse returning nothing means the
              format changed, not that the LSE stopped listing companies. In
              production this would run monthly on a cron.
            </p>
          </div>

          <div className="mt-8 rounded-sm border border-line bg-surface p-4">
            <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
              Source
            </div>
            <a
              href={LSE_DATA.sourceIndexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-[12.5px] text-text underline decoration-line-strong underline-offset-2 hover:decoration-text-muted"
            >
              {LSE_DATA.source}
            </a>
            <p className="tabular mt-2 text-[11.5px] text-text-muted">
              Fetched {fetched.toLocaleString("en-GB")} ·{" "}
              {LSE_DATA.issues.length} admissions ·{" "}
              {LSE_DATA.files.length} factsheets
              {LSE_DATA.summary
                ? ` · ${LSE_DATA.summary.companiesTotal.toLocaleString("en-GB")} companies on the Main Market at ${LSE_DATA.latestPeriod}`
                : ""}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
