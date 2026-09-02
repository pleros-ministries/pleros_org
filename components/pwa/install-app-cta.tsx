"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share } from "lucide-react";

import { useInstallPrompt } from "@/lib/pwa/use-install-prompt";

export function InstallAppCta() {
  const pathname = usePathname();
  const { status, promptInstall } = useInstallPrompt();
  const [isPrompting, setIsPrompting] = useState(false);

  if (
    pathname.startsWith("/preview/") ||
    status === "pending" ||
    status === "installed" ||
    status === "unsupported"
  ) {
    return null;
  }

  return (
    <div className="site-font-theme flex flex-col gap-3 rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] p-4 text-white shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/12"
        >
          <Download className="size-4.5" />
        </span>
        <div className="grid gap-1">
          <p className="site-title-text text-[0.9375rem] font-semibold leading-snug text-white">
            Add Pleros to your home screen
          </p>
          {status === "ios-manual" ? (
            <p className="site-body-text flex flex-wrap items-center gap-1 text-[0.8125rem] leading-snug text-white/85">
              Tap the
              {/* <Share className="size-3.5" aria-label="Share" /> */}
              Share icon, then choose &ldquo;Add to Home Screen&rdquo;.
            </p>
          ) : (
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.8125rem] leading-snug text-white/85">
              Install the app for quick, full-screen access to your dashboard.
            </p>
          )}
        </div>
      </div>

      {status === "installable" ? (
        <button
          type="button"
          disabled={isPrompting}
          onClick={async () => {
            setIsPrompting(true);
            try {
              await promptInstall();
            } finally {
              setIsPrompting(false);
            }
          }}
          className="site-button-text inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-[var(--radius-pill)] bg-white px-4.5 py-2.5 text-[0.875rem] font-medium leading-none text-[var(--color-brand-blue)] transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <Download className="size-4" />
          {isPrompting ? "Installing…" : "Install app"}
        </button>
      ) : null}
    </div>
  );
}
