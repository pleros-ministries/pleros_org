"use client";

type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function SeriesTab({ label, active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium leading-tight tracking-[-0.01em] transition-colors duration-150 ${
        active
          ? "bg-[var(--color-brand-blue)] text-white"
          : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-line)] hover:text-[var(--color-text)]"
      }`}
    >
      {label}
    </button>
  );
}
