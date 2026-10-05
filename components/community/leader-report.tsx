"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  MINISTRY_FIELDS,
  type MinistryNumbers,
} from "@/lib/community/ministry-report";
import { dateKeyLabel } from "@/lib/community/time";
import { shiftDate } from "@/lib/sogp/daily-date";

import type { OpenFlag } from "@/lib/db/queries/community-posts";
import type { StaffOutreachContact } from "@/lib/db/queries/outreach-contacts";
import type { LeaderReport } from "@/lib/db/queries/community-reports";
import {
  nudgeAtRiskMembers,
  resolveUnitFlag,
} from "@/app/(site)/dashboard/community/_actions/leader-actions";

import { OutreachContactBrowser } from "./report/outreach-contact-browser";

/** One day of the group's ministry reports, for its assigned pastor and admins. */
export type LeaderMinistryDay = {
  today: string;
  dateKey: string;
  memberCount: number;
  /** Members who sent a report that day. */
  rows: Array<{ name: string; report: MinistryNumbers & { note: string | null } }>;
};

export function LeaderReportView({
  report,
  flags,
  ministry,
  outreach,
  unitOptions,
}: {
  report: LeaderReport;
  /** Open reports on this group's posts and comments. */
  flags: OpenFlag[];
  /** null for a member leader, who does not see ministry reports. */
  ministry: LeaderMinistryDay | null;
  /** People the group's members met in the last 90 days; null for a member leader. */
  outreach: StaffOutreachContact[] | null;
  /** Every unit the viewer manages; a switcher appears when there are several. */
  unitOptions: Array<{ id: number; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState(
    "Checking in — is everything okay? We'd love to see you in the community.",
  );
  const [note, setNote] = useState<string | null>(null);
  const [flagNote, setFlagNote] = useState<string | null>(null);

  function resolveFlag(flagId: number, action: "hide" | "dismiss") {
    startTransition(async () => {
      setFlagNote(null);
      try {
        await resolveUnitFlag({ flagId, action });
        setFlagNote(action === "hide" ? "Content hidden." : "Report dismissed.");
        router.refresh();
      } catch {
        setFlagNote("Could not update that report. Try again.");
      }
    });
  }

  const stat = (label: string, value: string | number) => (
    <div className="grid gap-0.5 rounded-sm border border-zinc-200 bg-white p-3">
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
        {label}
      </span>
      <span className="ppc-heading text-base font-semibold text-zinc-900">
        {value}
      </span>
    </div>
  );

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          {report.unitName}
        </h1>
        {unitOptions.length > 1 ? (
          <select
            defaultValue={String(report.unitId)}
            onChange={(event) =>
              router.push(
                `/dashboard/community/leader?unitId=${event.target.value}`,
              )
            }
            className="h-8 rounded-sm border border-zinc-200 px-2 text-xs"
          >
            {unitOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stat("Members", report.memberCount)}
        {stat(
          "Prep started",
          `${report.preparationBuckets.some + report.preparationBuckets.done}/${report.memberCount}`,
        )}
        {stat("Prep complete", report.preparationBuckets.done)}
        {stat("Prayer active", report.morningPrayerActive)}
      </div>

      {ministry ? (
        <section className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
              Ministry reports · {dateKeyLabel(ministry.dateKey)}
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <Link
                href={`/dashboard/community/leader?unitId=${report.unitId}&date=${shiftDate(ministry.dateKey, -1)}`}
                scroll={false}
                className="text-[var(--color-brand-blue)] underline underline-offset-2"
              >
                Previous day
              </Link>
              {ministry.dateKey < ministry.today ? (
                <Link
                  href={`/dashboard/community/leader?unitId=${report.unitId}&date=${shiftDate(ministry.dateKey, 1)}`}
                  scroll={false}
                  className="text-[var(--color-brand-blue)] underline underline-offset-2"
                >
                  Next day
                </Link>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            {ministry.rows.length} of {ministry.memberCount} members sent a
            report. Numbers are as each person entered them.
          </p>
          {ministry.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">Member</th>
                    {MINISTRY_FIELDS.map((field) => (
                      <th key={field.key} className="px-2 py-2 text-right font-medium">
                        {field.short}
                      </th>
                    ))}
                    <th className="px-2 py-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {ministry.rows.map((row, index) => (
                    <tr key={`${row.name}-${index}`}>
                      <td className="whitespace-nowrap px-2 py-2 font-medium text-zinc-900">
                        {row.name}
                      </td>
                      {MINISTRY_FIELDS.map((field) => (
                        <td
                          key={field.key}
                          className="px-2 py-2 text-right tabular-nums text-zinc-700"
                        >
                          {row.report[field.key]}
                        </td>
                      ))}
                      <td className="max-w-[14rem] px-2 py-2 text-zinc-600">
                        {row.report.note ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {outreach ? (
        <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
          <div className="grid gap-0.5 border-b border-zinc-100 px-4 py-3">
            <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
              People met in outreach
            </h2>
            <p className="text-xs text-zinc-500">
              Recorded by this group&apos;s members in the last 90 days.
            </p>
          </div>
          <OutreachContactBrowser
            contacts={outreach}
            staff
            defaultStatus="pending"
            emptyText="No one has been recorded yet."
          />
        </section>
      ) : null}

      <section className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          Reported in your group ({flags.length})
        </h2>
        {flags.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Nothing has been reported. Reports from members appear here.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {flags.map((flag) => (
              <li key={flag.id} className="grid gap-1 py-2.5 text-xs">
                <p className="text-zinc-500">
                  {flag.targetType === "post" ? "Post" : "Comment"}
                  {flag.authorName ? ` by ${flag.authorName}` : ""} · reported
                  by {flag.reporterName}
                </p>
                {flag.preview ? (
                  <p className="text-sm text-zinc-800">“{flag.preview}”</p>
                ) : null}
                <p className="text-zinc-600">Reason: {flag.reason}</p>
                <div className="flex items-center gap-4 pt-0.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => resolveFlag(flag.id, "hide")}
                    className="font-medium text-red-700 underline underline-offset-2 disabled:opacity-50"
                  >
                    Hide content
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => resolveFlag(flag.id, "dismiss")}
                    className="text-zinc-500 underline underline-offset-2 disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {flagNote ? (
          <p role="status" className="text-xs text-zinc-600">
            {flagNote}
          </p>
        ) : null}
      </section>

      <section className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          At risk ({report.atRisk.length})
        </h2>
        {report.atRisk.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Everyone has started preparation or Prayer Watch.
          </p>
        ) : (
          <>
            <p className="text-xs text-zinc-500">
              {report.atRisk.map((m) => m.firstName).join(", ")}
            </p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={2}
              className="rounded-sm border border-zinc-200 p-2 text-xs"
            />
            <button
              type="button"
              disabled={pending || !message.trim()}
              onClick={() =>
                startTransition(async () => {
                  setNote(null);
                  try {
                    await nudgeAtRiskMembers({
                      unitId: report.unitId,
                      message,
                    });
                    setNote("Nudge sent.");
                  } catch (e) {
                    setNote(e instanceof Error ? e.message : "Could not send.");
                  }
                })
              }
              className="inline-flex h-8 w-fit items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Sending…" : "Nudge at-risk members"}
            </button>
            {note ? <p className="text-xs text-zinc-600">{note}</p> : null}
          </>
        )}
      </section>

      <section className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          Recent joiners
        </h2>
        {report.recentJoiners.length === 0 ? (
          <p className="text-xs text-zinc-500">No members yet.</p>
        ) : (
          <ul className="text-xs text-zinc-600">
            {report.recentJoiners.map((joiner, index) => (
              <li key={index}>
                {joiner.firstName} · joined {joiner.joinedMonth}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
