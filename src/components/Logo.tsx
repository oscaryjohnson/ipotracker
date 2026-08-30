/**
 * Project mark.
 *
 * Three ascending bars with the tallest breaking through a threshold line --
 * a listing crossing into public markets. Deliberately not a company logo: no
 * wordmark lockup, no colour, no gradient. It is a glyph that belongs to the
 * data, drawn on the same 24-unit grid and the same stroke weight as the icons
 * already in the interface, so it reads as part of the instrument rather than
 * branding bolted onto it.
 *
 * Uses currentColor throughout, so it inherits the theme with no dark-mode
 * variant to maintain.
 */
export function Logo({
  size = 18,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      role="img"
      aria-label="Global IPO Pipeline"
    >
      {/* The threshold: the line a company crosses when it lists. Weighted
          heavily enough to survive at 16px -- if it fades out, the mark
          collapses into a generic bar chart and the idea is lost. */}
      <path
        d="M3.5 9.5H20.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Two bars still below the line, one breaking clear above it. */}
      <path
        d="M5.5 20V15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M11.5 20V12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M17.5 20V4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
