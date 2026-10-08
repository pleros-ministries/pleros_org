"use client";

import {
  DownloadIcon,
  ShareIcon,
  SmartphoneIcon,
  SquarePlusIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { InstallPromptStatus } from "@/lib/pwa/use-install-prompt";

import {
  SETUP_HELPER,
  SETUP_NOTE,
  SETUP_PRIMARY_BUTTON,
  SETUP_SECONDARY_BUTTON,
} from "./styles";

/** Step 1: add Pleros to the Home Screen. */
export function InstallStep({
  status,
  installRecorded,
  onInstall,
  onMarkInstalled,
  preview,
}: {
  status: InstallPromptStatus;
  /**
   * The learner's account already has an install recorded. That is not tied
   * to a device, so it may be this one opened in a browser tab, or another.
   */
  installRecorded: boolean;
  onInstall: () => Promise<unknown>;
  onMarkInstalled?: () => Promise<unknown>;
  preview: boolean;
}) {
  const [isPrompting, setIsPrompting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const recorded = useRef(false);

  // The first time the learner opens this page inside the installed app,
  // remember it, so the step also shows as done on their other devices.
  useEffect(() => {
    if (
      status !== "installed" ||
      installRecorded ||
      preview ||
      !onMarkInstalled ||
      recorded.current
    ) {
      return;
    }
    recorded.current = true;
    onMarkInstalled().catch(() => {
      recorded.current = false;
    });
  }, [status, installRecorded, preview, onMarkInstalled]);

  if (status === "installed") {
    return <p>Pleros is installed on this device.</p>;
  }

  if (status === "pending") {
    return <p className={SETUP_NOTE}>Checking this device…</p>;
  }

  const confirmButton = installRecorded ? null : (
    <button
      type="button"
      disabled={preview || isMarking || !onMarkInstalled}
      onClick={async () => {
        if (!onMarkInstalled) return;
        setIsMarking(true);
        try {
          await onMarkInstalled();
        } finally {
          setIsMarking(false);
        }
      }}
      className={SETUP_SECONDARY_BUTTON}
    >
      {isMarking ? "Saving…" : "I've installed it"}
    </button>
  );

  return (
    <>
      {installRecorded ? (
        <p className={SETUP_NOTE}>
          You have already installed Pleros. If it is not on this device yet,
          you can add it here too.
        </p>
      ) : null}

      {status === "installable" ? (
        <button
          type="button"
          disabled={preview || isPrompting}
          onClick={async () => {
            setIsPrompting(true);
            try {
              await onInstall();
            } finally {
              setIsPrompting(false);
            }
          }}
          className={SETUP_PRIMARY_BUTTON}
        >
          <DownloadIcon className="size-4" aria-hidden="true" />
          {isPrompting ? "Installing…" : "Install app"}
        </button>
      ) : status === "ios-manual" ? (
        <>
          <ol className="grid gap-2.5">
            <li className="flex items-start gap-2.5">
              <ShareIcon
                className="mt-0.5 size-4 shrink-0 text-[var(--color-brand-blue)]"
                aria-hidden="true"
              />
              <span>Tap the Share button in Safari.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <SquarePlusIcon
                className="mt-0.5 size-4 shrink-0 text-[var(--color-brand-blue)]"
                aria-hidden="true"
              />
              <span>Choose &ldquo;Add to Home Screen&rdquo;, then tap Add.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <SmartphoneIcon
                className="mt-0.5 size-4 shrink-0 text-[var(--color-brand-blue)]"
                aria-hidden="true"
              />
              <span>
                Open Pleros from your Home Screen, sign in again, and return to
                Welcome Pack, then App and reminders.
              </span>
            </li>
          </ol>
          <p className={SETUP_HELPER}>
            If you do not see Add to Home Screen, open pleros.org in Safari
            first.
          </p>
          {confirmButton}
        </>
      ) : (
        <>
          <p>
            Use your browser menu to install Pleros. If you opened this from
            Telegram, Instagram or Facebook, open pleros.org in Chrome or Safari
            first.
          </p>
          {confirmButton}
        </>
      )}
    </>
  );
}
