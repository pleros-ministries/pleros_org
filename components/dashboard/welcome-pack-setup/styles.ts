/**
 * Shared classes for the Welcome Pack setup steps. Sizes follow the learner
 * form rules: 14px body and buttons, 13px labels and errors, 12px helpers.
 */

import { buttonPrimary, buttonSecondary } from "../shared/ui";
export const SETUP_PRIMARY_BUTTON = buttonPrimary;
export const SETUP_SECONDARY_BUTTON = buttonSecondary;

export const SETUP_NOTE =
  "text-[0.8125rem] leading-[1.5] text-[var(--color-text-muted)]";

export const SETUP_HELPER =
  "text-[0.75rem] leading-[1.5] text-[var(--color-text-muted)]";

export const SETUP_LABEL =
  "text-[0.8125rem] font-medium leading-[1.4] text-[var(--color-text-strong)]";

export const SETUP_ERROR = "text-[0.8125rem] leading-[1.5] text-[var(--destructive)]";

export const SETUP_SUCCESS =
  "text-[0.8125rem] font-medium leading-[1.5] text-[var(--color-brand-blue)]";
