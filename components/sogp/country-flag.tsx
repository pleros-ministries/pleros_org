import * as FLAG_SVGS from "country-flag-icons/string/3x2";

import { cn } from "@/lib/utils";

const flagSvgByCode = FLAG_SVGS as Record<string, string | undefined>;

/**
 * Renders a country flag as an inline SVG so every platform — including Windows,
 * which ships no regional-indicator emoji — shows the same real flag. Codes the
 * icon set does not cover fall back to a small lettered badge.
 */
export function CountryFlag({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const svg = flagSvgByCode[code.toUpperCase()];

  if (!svg) {
    return (
      <span aria-hidden="true" className={cn("sogp-flag-badge", className)}>
        {code}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn("sogp-flag", className)}
      // Trusted, static SVG markup shipped with the country-flag-icons package.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
