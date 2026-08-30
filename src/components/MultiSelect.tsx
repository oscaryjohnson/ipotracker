"use client";

import { useEffect, useRef, useState } from "react";

export interface MultiSelectOption<T extends string> {
  value: T;
  label: string;
  /** Small right-aligned figure, used here for the record count. */
  count?: number;
}

/**
 * Checkbox dropdown. Closes on outside click and on Escape, and returns focus
 * to the trigger so keyboard use does not dead-end.
 */
export function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: MultiSelectOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(value: T) {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  const active = selected.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-[12px] transition-colors ${
          active
            ? "border-text bg-text text-bg"
            : "border-line bg-surface text-text-muted hover:border-line-strong hover:text-text"
        }`}
      >
        <span>{label}</span>
        {active ? (
          <span className="tabular rounded-sm bg-bg/20 px-1 text-[11px] font-medium">
            {selected.length}
          </span>
        ) : null}
        <svg viewBox="0 0 12 12" className="h-3 w-3 opacity-60" aria-hidden>
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 top-9 z-20 max-h-80 w-60 overflow-y-auto rounded-sm border border-line bg-surface p-1 shadow-[var(--shadow)]">
          {active ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mb-1 w-full rounded-sm px-2 py-1.5 text-left text-[11px] uppercase tracking-[0.06em] text-text-muted hover:bg-surface-2 hover:text-text"
            >
              Clear selection
            </button>
          ) : null}

          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-[12.5px] hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                  className="h-3.5 w-3.5 shrink-0 accent-[var(--text)]"
                />
                <span className="flex-1 truncate">{option.label}</span>
                {option.count !== undefined ? (
                  <span className="tabular text-[11px] text-text-faint">
                    {option.count}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
