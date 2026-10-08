"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  activityKeyNumbers,
  activityTitle,
  activityWhere,
} from "@/lib/community/activity-form";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";
import { deleteMinistryActivity } from "@/app/(site)/dashboard/community/_actions/report-actions";

import { ActivityKindIcon } from "./activity-kind-icon";
import { dayHref } from "./day-picker";
import { card, errorText, textLink } from "./styles";
import { useReportAction } from "./use-report-action";

/** One activity on the Report tab, with its key numbers and the edit and remove actions. */
export function ActivityCard({
  activity,
  today,
  canChange,
}: {
  activity: MemberActivity;
  today: string;
  /** False once the day has left the reporting window. */
  canChange: boolean;
}) {
  const router = useRouter();
  const { run, pending, error } = useReportAction();
  const where = activityWhere(activity);
  const people =
    activity.peopleCount > 0
      ? `${activity.peopleCount} ${activity.peopleCount === 1 ? "person" : "people"}`
      : null;

  function remove() {
    if (
      !window.confirm(
        "Remove this activity? People you added with it stay on your People list.",
      )
    ) {
      return;
    }
    run(() => deleteMinistryActivity(activity.id), {
      refresh: false,
      onDone: () => router.push(dayHref(activity.activityDate, today, "removed")),
    });
  }

  return (
    <li className={`${card} grid gap-1.5 p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-brand-sky-soft) text-(--color-brand-blue)">
            <ActivityKindIcon kind={activity.kind} />
          </span>
          <p className="min-w-0 truncate text-sm font-medium text-zinc-900">
            {activityTitle(activity)}
          </p>
        </div>
        {people ? (
          <span className="shrink-0 text-xs text-zinc-500">{people}</span>
        ) : null}
      </div>
      {where ? <p className="text-xs text-zinc-500">{where}</p> : null}
      <p className="text-[13px] text-zinc-700">{activityKeyNumbers(activity)}</p>
      {canChange ? (
        <div className="flex flex-wrap items-center gap-4 pt-0.5">
          <Link href={`/dashboard/community/report/${activity.id}`} className={textLink}>
            Edit
          </Link>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-[13px] font-medium text-red-700 underline underline-offset-2 disabled:opacity-60"
          >
            {pending ? "Removing…" : "Remove"}
          </button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className={errorText}>
          {error}
        </p>
      ) : null}
    </li>
  );
}
