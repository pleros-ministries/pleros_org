"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";

import styles from "./report-sheet.module.css";

export { styles as sheetStyles };

/** Matches the sheet exit in report-sheet.module.css. */
const EXIT_MS = 180;

/**
 * One report pop-up (Pastor, 18 October: report on the same page, a pop-up
 * instead of a redirect). Escape, the shade and the close button all close it;
 * `close` is handed to the children so a save can close it too.
 */
export function ReportSheet({ title, subtitle, back, onBack, onClose, footer, children }: {
  title: string; subtitle?: string;
  /** A back link above the title, for the second step of a two-step sheet. */
  back?: string; onBack?: () => void;
  onClose: () => void;
  footer?: (close: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const titleId = useId();
  const sheet = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    setClosing(true);
    window.setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    sheet.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      // A contact dialog opened from inside the sheet handles its own Escape.
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) close();
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; opener?.focus?.(); };
  }, [close]);

  return <div className={styles.shade} data-closing={closing || undefined} role="presentation" onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div ref={sheet} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      <span className={styles.grab} aria-hidden="true" />
      <div className={styles.head}>
        <div className={styles.headCopy}>
          {back && onBack ? <button type="button" className={styles.back} onClick={onBack}><ChevronLeftIcon className="size-4" aria-hidden="true" />{back}</button> : null}
          <h2 id={titleId} data-dashboard-shell-title>{title}</h2>
          {subtitle ? <p className={styles.muted}>{subtitle}</p> : null}
        </div>
        <button type="button" className={styles.close} onClick={close} aria-label="Close"><XIcon className="size-4" aria-hidden="true" /></button>
      </div>
      <div className={styles.body}>{children(close)}</div>
      {footer ? <div className={styles.foot}>{footer(close)}</div> : null}
    </div>
  </div>;
}

export function Stepper({ value, onChange, min = 0, max, label, unit, detail }: {
  value: number; onChange: (value: number) => void; min?: number; max: number; label: string;
  /** Singular and plural words after the number, e.g. ["chapter", "chapters"]. */
  unit?: [string, string]; detail?: string;
}) {
  return <div className={styles.stepper} role="group" aria-label={label}>
    <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`One fewer: ${label}`}><MinusIcon className="size-4" aria-hidden="true" /></button>
    <span className={styles.stepValue} aria-live="polite"><b>{value}{unit ? ` ${unit[value === 1 ? 0 : 1]}` : ""}</b>{detail ? <span>{detail}</span> : null}</span>
    <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`One more: ${label}`}><PlusIcon className="size-4" aria-hidden="true" /></button>
  </div>;
}

export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: readonly { key: T; label: string }[]; value: T; onChange: (value: T) => void; label: string;
}) {
  return <div className={styles.seg} role="group" aria-label={label}>
    {options.map(option => <button key={option.key} type="button" aria-pressed={value === option.key} onClick={() => onChange(option.key)}>{option.label}</button>)}
  </div>;
}
