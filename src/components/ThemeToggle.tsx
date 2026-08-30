"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/hooks";

/**
 * Light/dark switch.
 *
 * The button renders in a neutral state until mounted. Before that we cannot
 * know the resolved theme without reading the DOM, and guessing would produce
 * a hydration mismatch and a visible icon flip on load.
 */
export function ThemeToggle() {
  const { choice, apply } = useTheme();
  const [resolved, setResolved] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    function resolve(): "light" | "dark" {
      const attribute = document.documentElement.getAttribute("data-theme");
      if (attribute === "dark" || attribute === "light") return attribute;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    setResolved(resolve());

    // Keep following the system while the user has not made a choice.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!document.documentElement.hasAttribute("data-theme")) {
        setResolved(media.matches ? "dark" : "light");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        const next = isDark ? "light" : "dark";
        apply(next);
        setResolved(next);
      }}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-8 w-8 items-center justify-center rounded-sm border border-line bg-surface text-text-muted transition-colors hover:border-line-strong hover:text-text"
    >
      {resolved === null ? (
        <span className="h-3.5 w-3.5" />
      ) : isDark ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <circle cx="8" cy="8" r="3.1" fill="currentColor" />
          <path
            d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.95 3.05l-1.13 1.13M4.18 11.82l-1.13 1.13M12.95 12.95l-1.13-1.13M4.18 4.18L3.05 3.05"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M13.5 9.6A5.9 5.9 0 016.4 2.5a5.9 5.9 0 107.1 7.1z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
