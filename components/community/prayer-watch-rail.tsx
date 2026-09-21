"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoonIcon, SunIcon, SunriseIcon, type LucideIcon } from "lucide-react";

import {
  getNextPrayerWatchSessionId,
  PRAYER_WATCH_SESSIONS,
  type PrayerWatchSessionId,
} from "@/lib/prayer-watch";

const sessionIcons: Record<PrayerWatchSessionId, LucideIcon> = {
  morning: SunriseIcon,
  afternoon: SunIcon,
  evening: MoonIcon,
};

export function PrayerWatchRail() {
  const [nextId, setNextId] = useState<PrayerWatchSessionId | null>(null);

  useEffect(() => {
    const update = () => setNextId(getNextPrayerWatchSessionId());
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-(--color-line-strong) bg-[var(--color-brand-blue)] text-white shadow-(--shadow-sm)">
      <div className="px-4 pt-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-white/70">
          Prayer Watch · today
        </p>
      </div>
      <ul className="mt-2 grid gap-0.5 px-2 pb-2">
        {PRAYER_WATCH_SESSIONS.map((session) => {
          const Icon = sessionIcons[session.id];
          const isNext = session.id === nextId;
          return (
            <li key={session.id}>
              <div
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm ${
                  isNext
                    ? "bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]"
                    : "text-white/85"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2} />
                <span className="flex-1 font-medium">{session.label}</span>
                <span
                  className={`font-semibold tabular-nums ${
                    isNext ? "" : "text-white"
                  }`}
                >
                  {session.time}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <Link
        href="/dashboard/prayer-watch"
        className="block border-t border-white/15 px-4 py-2.5 text-center text-xs font-semibold text-[var(--color-brand-lime)] transition-colors hover:bg-white/5"
      >
        Open Prayer Watch
      </Link>
    </section>
  );
}
