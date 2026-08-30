"use client";

import { useCallback, useEffect, useState } from "react";

const BOOKMARK_KEY = "ipo-tracker:bookmarks";
const THEME_KEY = "ipo-tracker:theme";

export type ThemeChoice = "light" | "dark" | "system";

function readBookmarks(): string[] {
  try {
    const raw = window.localStorage.getItem(BOOKMARK_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    // Private windows and blocked site data throw on access, not just return
    // empty. Bookmarks are a convenience; failing to read one is not an error.
    return [];
  }
}

/**
 * Bookmarked company ids, persisted per browser.
 *
 * Reads happen in an effect rather than during render so the server-rendered
 * markup and the first client render agree -- otherwise every bookmarked row
 * would trigger a hydration mismatch.
 */
export function useBookmarks() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(readBookmarks());
    setHydrated(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((current) => {
      const next = current.includes(id)
        ? current.filter((existing) => existing !== id)
        : [...current, id];
      try {
        window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable -- keep the in-memory state so the session still
        // behaves correctly, it just will not survive a reload.
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    try {
      window.localStorage.removeItem(BOOKMARK_KEY);
    } catch {
      // Nothing to do; the in-memory list is already cleared.
    }
  }, []);

  return { ids, toggle, clear, hydrated };
}

/**
 * Theme choice, persisted and reflected onto `<html data-theme>`.
 *
 * The initial paint is handled by the blocking script in the layout; this hook
 * owns everything after that.
 */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") setChoice(stored);
    } catch {
      // Fall back to following the system preference.
    }
  }, []);

  const apply = useCallback((next: ThemeChoice) => {
    setChoice(next);
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
    try {
      if (next === "system") window.localStorage.removeItem(THEME_KEY);
      else window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Preference just will not persist across reloads.
    }
  }, []);

  return { choice, apply };
}

/** Copy-to-clipboard with a short-lived "copied" acknowledgement. */
export function useCopy(resetAfterMs = 1600) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (copied === null) return;
    const timer = window.setTimeout(() => setCopied(null), resetAfterMs);
    return () => window.clearTimeout(timer);
  }, [copied, resetAfterMs]);

  const copy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
    } catch {
      // Clipboard permission denied or unavailable over a non-secure origin.
    }
  }, []);

  return { copied, copy };
}
