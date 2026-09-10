"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, X } from "lucide-react";

import { useInstallPrompt } from "@/lib/pwa/use-install-prompt";

const DISMISS_STORAGE_KEY = "pleros:install-cta-dismissed";

export function InstallAppCta() {
  const pathname = usePathname();
  const { status, promptInstall, canShare, shareApp } = useInstallPrompt();
  const [isPrompting, setIsPrompting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      setIsDismissed(
        window.localStorage.getItem(DISMISS_STORAGE_KEY) === "true",
      );
    } catch {
      // Accessing localStorage can throw in private mode — treat as not dismissed.
    }
  }, []);

  const dismiss = () => {
    setIsDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    } catch {
      // Ignore write failures; the CTA stays hidden for this session regardless.
    }
  };

  if (
    isDismissed ||
    pathname.startsWith("/preview/") ||
    status === "pending" ||
    status === "installed" ||
    status === "unsupported"
  ) {
    return null;
  }

  return (
    <div className="site-font-theme relative flex flex-col gap-3 rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] p-4 pr-10 text-white shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5 sm:pr-12">
      <div className="flex items-start gap-3">
        {/* <span
          aria-hidden="true"
          className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/12"
        >
          <Download className="size-4.5" />
        </span> */}
        <div className="grid gap-1">
          <p className="site-title-text text-[0.9375rem] font-semibold leading-snug text-white">
            Add Pleros to your home screen
          </p>
          {status === "ios-manual" ? (
            <p className="site-body-text flex flex-wrap items-center gap-1 text-[0.8125rem] leading-.5 text-white/85">
              Tap the
              {/* <Share className="size-3.5" aria-label="Share" /> */}
              download button, then choose &ldquo;Add to Home Screen&rdquo;.
            </p>
          ) : (
            <p className="site-body-text text-[0.8125rem] leading-snug text-white/85">
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
      ) : status === "ios-manual" && canShare ? (
        <button
          type="button"
          onClick={() => {
            void shareApp();
          }}
          className="site-button-text inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-[var(--radius-pill)] bg-white px-4.5 py-2.5 text-[0.875rem] font-medium leading-none text-[var(--color-brand-blue)] transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <Share className="size-4" />
          Download App
        </button>
      ) : null}

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors duration-150 hover:bg-white/12 hover:text-white sm:right-3 sm:top-3"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
