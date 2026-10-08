/** Shared class strings for the daily report area, so every screen reads the same. */

export const card =
  "rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)";

export const labelClass = "grid gap-1 text-[13px] font-medium text-zinc-700";

export const inputClass =
  "h-11 w-full rounded-xl border border-zinc-200 px-3 text-base font-normal text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-300 aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-red-100";

export const selectClass = `${inputClass} appearance-none bg-white pr-10`;

export const textareaClass =
  "w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-base font-normal leading-relaxed outline-none focus:border-zinc-300 aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-red-100";

export const primaryButton =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-(--color-brand-blue) px-5 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-blue-hover) disabled:opacity-60";

export const outlineButton =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-(--color-brand-blue) px-5 text-sm font-semibold text-(--color-brand-blue) transition-colors hover:bg-(--color-brand-sky-soft) disabled:opacity-60";

export const smallOutlineButton =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-(--color-brand-blue) px-4 text-[13px] font-semibold text-(--color-brand-blue) transition-colors hover:bg-(--color-brand-sky-soft) disabled:opacity-60";

export const textLink =
  "text-[13px] font-medium text-(--color-brand-blue) underline underline-offset-2";

export const errorText = "text-[13px] text-red-700";
