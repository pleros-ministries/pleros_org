"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import type { LeaderReport } from "@/lib/db/queries/community-reports";
import { nudgeAtRiskMembers } from "@/app/(site)/dashboard/community/_actions/leader-actions";

export function LeaderReportView({
  report,
  isAdmin,
  unitOptions,
}: {
  report: LeaderReport;
  isAdmin: boolean;
  unitOptions: Array<{ id: number; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState(
    "Checking in — is everything okay? We'd love to see you in the community.",
  );
  const [note, setNote] = useState<string | null>(null);

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
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <nav className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm">
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link
            href="/dashboard/community"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 hover:text-white"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Community
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
            Leader
          </span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-5">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            {report.unitName}
          </h1>
          {isAdmin && unitOptions.length > 1 ? (
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
    </section>
  );
}
