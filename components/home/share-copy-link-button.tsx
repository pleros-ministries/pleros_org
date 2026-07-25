"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

export function ShareCopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-6 py-2.5 text-[0.8125rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.18)] transition-transform duration-150 hover:-translate-y-px"
      aria-live="polite"
    >
      {copied ? (
        <CheckIcon className="size-4" />
      ) : (
        <CopyIcon className="size-4" />
      )}
      {copied ? "Copied link" : "Copy your referral link"}
    </button>
  );
}
