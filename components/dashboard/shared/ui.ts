/**
 * Class strings shared by the signed-in dashboard pages and the public
 * dashboard demo. Brand tokens only; nothing here defines a new colour.
 * Keep this module free of server actions, auth, database and push imports:
 * both the live pages and the isolated demo load it.
 */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)";

/** Calm white surface with a hairline border. */
export const panel = "rounded-[var(--radius-lg)] border border-(--color-line) bg-white";

const buttonBase = `inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-[background-color,color,border-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-50 ${focusRing}`;

export const buttonPrimary = `${buttonBase} bg-(--color-brand-blue) text-white hover:bg-(--color-brand-blue-hover)`;
export const buttonSecondary = `${buttonBase} border border-(--color-line-strong) bg-white text-(--color-text-strong) hover:border-(--color-brand-blue) hover:text-(--color-brand-blue)`;

/** 10px muted uppercase label used for eyebrows, dates and step numbers. */
export const eyebrowText =
  "text-[10px] font-medium uppercase leading-snug tracking-[0.08em] text-(--color-text-muted)";

/** 24px page title. */
export const pageTitleText =
  "text-[24px] font-medium leading-[1.1] tracking-[-0.025em] text-(--color-text-strong)";

/** At most 15px for section, card and dialog headings. */
export const sectionTitleText =
  "text-[15px] font-medium tracking-[-0.015em] text-(--color-text-strong)";

/** Page gutters matching the demo's content column. */
export const pageGutter =
  "mx-auto w-full max-w-[1120px] px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16";

export const dashboardFont = "font-[family-name:var(--font-be-vietnam-pro)]";
