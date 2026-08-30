"use client";

import { NA } from "@/lib/format";
import type { Contact, EmailProvenance, IpoStatus } from "@/lib/types";

/* -------------------------------------------------------------------------
   Small shared pieces. Deliberately austere: status and sector are conveyed
   with border weight and letter-spacing, not colour. The only coloured thing
   in the entire table is email provenance, because that is the one signal a
   user could act on and get wrong.
------------------------------------------------------------------------- */

const PROVENANCE_LABEL: Record<EmailProvenance, string> = {
  verified: "Verified",
  inferred: "Inferred",
  unavailable: "Unavailable",
};

const PROVENANCE_DOT: Record<EmailProvenance, string> = {
  verified: "bg-ok",
  inferred: "bg-warn",
  unavailable: "bg-text-faint",
};

export function ProvenanceDot({ provenance }: { provenance: EmailProvenance }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${PROVENANCE_DOT[provenance]}`}
      aria-hidden
    />
  );
}

export function ProvenanceBadge({
  provenance,
}: {
  provenance: EmailProvenance;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
      <ProvenanceDot provenance={provenance} />
      {PROVENANCE_LABEL[provenance]}
    </span>
  );
}

const STATUS_LABEL: Record<IpoStatus, string> = {
  approved: "Approved",
  filed: "Filed",
  rumoured: "Rumoured",
};

/** Confidence expressed structurally: solid, plain, then dashed. */
const STATUS_STYLE: Record<IpoStatus, string> = {
  approved: "border-text-muted text-text",
  filed: "border-line-strong text-text-muted",
  rumoured: "border-dashed border-line-strong text-text-faint",
};

export function StatusBadge({ status }: { status: IpoStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-[1px] text-[10px] font-medium uppercase tracking-[0.08em] ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SectorTag({ label }: { label: string }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">
      {label}
    </span>
  );
}

/** Consistent rendering for an absent value. */
export function Missing({ reason }: { reason?: string }) {
  return (
    <span className="text-text-faint" title={reason}>
      {NA}
    </span>
  );
}

export function CopyIcon({ done }: { done: boolean }) {
  return done ? (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M3.5 8.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <rect
        x="5.25"
        y="5.25"
        width="7.5"
        height="7.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M10.5 3.25H4.75c-.83 0-1.5.67-1.5 1.5V10.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * An email with its provenance and a copy control.
 *
 * When there is no address we show why rather than a bare N/A -- the reason is
 * the useful part, and it is what stops an inferred address being mistaken for
 * a confirmed one.
 */
export function EmailField({
  contact,
  role,
  copied,
  onCopy,
}: {
  contact: Contact;
  role: string;
  copied: string | null;
  onCopy: (value: string) => void;
}) {
  if (!contact.email) {
    return (
      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
          {role} email
        </div>
        <Missing reason={contact.emailNote} />
        {contact.emailNote ? (
          <p className="max-w-xs text-[11px] leading-snug text-text-faint">
            {contact.emailNote}
          </p>
        ) : null}
      </div>
    );
  }

  const isCopied = copied === contact.email;

  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-[0.08em] text-text-faint">
        {role} email
      </div>
      {/* Addresses run long (investorrelations@highveldrenewables.co.za) and
          have no natural break points, so the row must be allowed to wrap and
          the link to break mid-word. Without min-w-0 the flex item refuses to
          shrink below its content and overflows into the next grid column. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <a
          href={`mailto:${contact.email}`}
          className="min-w-0 break-all font-mono text-[12.5px] text-text underline decoration-line-strong underline-offset-2 hover:decoration-text-muted"
        >
          {contact.email}
        </a>
        <button
          type="button"
          onClick={() => onCopy(contact.email!)}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-[0.06em] text-text-muted transition-colors hover:border-line-strong hover:text-text"
          aria-label={`Copy ${role} email address`}
        >
          <CopyIcon done={isCopied} />
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
      <ProvenanceBadge provenance={contact.emailProvenance} />
      {contact.emailProvenance === "inferred" && contact.emailNote ? (
        <p className="max-w-xs text-[11px] leading-snug text-text-faint">
          {contact.emailNote}
        </p>
      ) : null}
    </div>
  );
}
