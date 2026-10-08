import Link from "next/link";
import { CheckIcon } from "lucide-react";

import type { ActivityLine } from "@/lib/community/ministry-report";
import { dateKeyLabel } from "@/lib/community/time";

import { card } from "./styles";

/** Where each kind of Pleros activity is done, so an empty line can be acted on. */
const ACTIVITY_LINKS: Record<ActivityLine["key"], string> = {
  bible: "/dashboard/prayer-watch",
  prayerWatch: "/dashboard/prayer-watch",
  sogp: "/dashboard/sogp",
  podcast: "/dashboard/podcast",
};

/**
 * One line of what Pleros already recorded for the day, so the member does
 * not enter it again: a tick where something was done, a link where not.
 */
export function PlerosTodayStrip({
  dateKey,
  today,
  lines,
}: {
  dateKey: string;
  today: string;
  lines: ActivityLine[];
}) {
  return (
    <section className={`${card} px-4 py-2.5 text-xs text-zinc-600`}>
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="font-medium text-zinc-900">
          On Pleros {dateKey === today ? "today" : dateKeyLabel(dateKey)}:
        </span>
        {lines.map((line, index) => (
          <span key={line.key} className="inline-flex items-center gap-1">
            {index > 0 ? <span aria-hidden className="text-zinc-300">·</span> : null}
            <span>{line.label}</span>
            {line.detail ? (
              <CheckIcon
                className="size-3.5 text-emerald-600"
                strokeWidth={2.5}
                aria-label={`done: ${line.detail}`}
              />
            ) : (
              <Link
                href={ACTIVITY_LINKS[line.key]}
                className="font-medium text-(--color-brand-blue) underline underline-offset-2"
              >
                Open
              </Link>
            )}
          </span>
        ))}
      </p>
    </section>
  );
}
