"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { AwardIcon, XIcon } from "lucide-react";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";
import { describeSogpWeekCertificates } from "@/lib/sogp/week-certificates";

import { SOGP_CERTIFICATES_HREF } from "./sogp-certificates-card";

const RECENT_MS = 14 * 24 * 60 * 60 * 1_000;
const STORAGE_PREFIX = "sogp-certificate-seen:";
const CHANGE_EVENT = "sogp-certificate-seen-change";

function isSeen(code: string) {
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${code}`) === "1";
  } catch {
    return false;
  }
}

function markSeen(codes: string[]) {
  try {
    for (const code of codes) {
      window.localStorage.setItem(`${STORAGE_PREFIX}${code}`, "1");
    }
  } catch {
    // Storage can be unavailable (private mode); the banner simply returns.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Celebrates week certificates issued in the last two weeks until the learner
 * dismisses them. Dismissal is a per-device convenience kept in localStorage.
 */
export function SogpCertificateCallout({
  data,
  preview = false,
}: {
  data: SogpJourneyData;
  preview?: boolean;
}) {
  const now = Date.parse(data.generatedAt);
  const recent = data.certificates.weeks.flatMap((week) =>
    week.certificate &&
    now - Date.parse(week.certificate.issuedAt) <= RECENT_MS
      ? [{ week: week.week, code: week.certificate.verificationCode }]
      : [],
  );
  const codes = recent.map((item) => item.code);
  // A comma-joined string keeps the snapshot stable between renders. The
  // server snapshot shows nothing, so the banner only appears once the
  // browser has confirmed it was not dismissed.
  const unseen = useSyncExternalStore(
    subscribe,
    () => codes.filter((code) => !isSeen(code)).join(","),
    () => "",
  );
  const visible = recent.filter((item) => unseen.split(",").includes(item.code));
  if (visible.length === 0) return null;

  const weeks = visible.map((item) => item.week);
  const label = describeSogpWeekCertificates(weeks);

  return (
    <section
      aria-label="Certificate earned"
      className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-brand-lime)] bg-white p-4 shadow-sm"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-brand-lime)]">
        <AwardIcon className="size-5 text-[var(--color-brand-blue)]" strokeWidth={2.2} />
      </span>
      <div className="grid min-w-0 flex-1 gap-2">
        <div className="grid gap-0.5">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">{label} earned</h2>
          <p className="text-xs leading-[1.5] text-zinc-500">
            {weeks.length === 1
              ? "Well done. Download it or share it with friends."
              : "Well done. Download them or share them with friends."}
          </p>
        </div>
        {preview ? null : (
          <Link
            href={SOGP_CERTIFICATES_HREF}
            className="inline-flex h-9 w-fit items-center rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white"
          >
            {weeks.length === 1 ? "View certificate" : "View certificates"}
          </Link>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => markSeen(visible.map((item) => item.code))}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <XIcon className="size-4" />
      </button>
    </section>
  );
}
