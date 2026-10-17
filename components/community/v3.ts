/**
 * Shared approved-community visual language (2026-10-16 mockup, painted with
 * repo tokens). Layout constants only; every permission, action and guard
 * lives in the components that use these.
 */

export const card =
  "rounded-2xl border border-[var(--color-community-edge)] bg-white";

export const identityName =
  "text-[13px] font-medium leading-[20px] text-[var(--color-community-ink)]";

export const meta =
  "text-[13px] leading-[20px] text-[var(--color-community-muted)]";

export const postTitle =
  "text-[15px] font-medium leading-[22px] tracking-[-0.02em] text-[var(--color-community-ink)]";

export const postBody =
  "whitespace-pre-line break-words text-[14px] leading-[21px] text-[var(--color-community-ink)]";

export const badge =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-[16px]";

export const badgeOfficial =
  "bg-[var(--color-community-sky-soft)] text-[var(--color-community-sky-ink)]";

export const badgePinned =
  "bg-[var(--color-community-violet-soft)] text-[var(--color-community-violet-ink)]";

export const badgeAmber =
  "bg-[var(--color-community-amber-soft)] text-[var(--color-community-amber-ink)]";

export const badgeGreen =
  "bg-[var(--color-community-green-soft)] text-[var(--color-community-green-ink)]";

export const badgeMint =
  "bg-[var(--color-community-mint-soft)] text-[var(--color-community-mint-ink)]";

export const badgeRed =
  "bg-[var(--color-community-red-soft)] text-[var(--color-community-red-ink)]";

export const pillHit = "grid place-items-center min-h-[44px] min-w-[44px]";

export const pillActive =
  "inline-flex min-h-[28px] items-center gap-2 rounded-full bg-[var(--color-community-blue)] px-2.5 text-[14px] font-medium text-white";

export const pillGhost =
  "inline-flex min-h-[28px] items-center gap-2 rounded-full px-2.5 text-[14px] font-medium text-[var(--color-community-ink)]";

export const countsRow =
  "flex items-center justify-between text-[13px] text-[var(--color-community-muted)]";

export const countsActive =
  "font-medium text-[var(--color-community-blue)]";

export const iconButton =
  "inline-flex size-11 items-center justify-center rounded-full text-[var(--color-community-ink)] hover:text-[var(--color-community-blue)]";

export const textAction =
  "text-[14px] font-medium text-[var(--color-community-blue)]";

/** Deterministic soft avatar tones: pastel background with inked initials. */
const AVATAR_TONES = [
  ["var(--color-community-sky-soft)", "var(--color-community-sky-ink)"],
  ["var(--color-community-violet-soft)", "var(--color-community-violet-ink)"],
  ["#fde3cf", "#7a3a10"],
  ["var(--color-community-amber-soft)", "var(--color-community-amber-ink)"],
] as const;

export function avatarTone(seed: string): {
  background: string;
  color: string;
} {
  let h = 0;
  const s = seed || "?";
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  const [background, color] = AVATAR_TONES[h % AVATAR_TONES.length]!;
  return { background, color };
}
