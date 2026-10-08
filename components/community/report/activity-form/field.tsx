import type { ReactNode } from "react";

import { errorText, labelClass } from "../styles";

/** A label, its control and, after an incomplete Next, its message. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={labelClass}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error ? <span className="text-xs font-normal text-zinc-500">{hint}</span> : null}
      {error ? (
        <span id={`${id}-error`} className={`${errorText} font-normal`}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** The `aria-*` wiring for a control inside a `Field`. */
export function fieldAria(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}
