"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateDiscipleshipGroupStatus } from "@/app/admin/_actions/community-actions";
import type { DiscipleshipAdminOverview } from "@/lib/db/queries/sogp-discipleship";

export function AdminDiscipleshipSection({ overview }: { overview: DiscipleshipAdminOverview }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function setStatus(groupId: number, status: "active" | "archived") {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateDiscipleshipGroupStatus({ groupId, status });
        setMessage(status === "archived" ? "Group paused." : "Group restored.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Action failed.");
      }
    });
  }

  const stats = [
    { label: "Groups created", value: overview.groupCount },
    { label: "Groups with disciples", value: overview.groupsWithDisciples },
    { label: "Active disciples", value: overview.activeDisciples },
    { label: "Average group size", value: overview.averageGroupSize },
  ];

  return (
    <section className="grid gap-3 rounded-sm border border-zinc-200 bg-white p-4">
      <div className="grid gap-0.5">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Discipleship groups</h2>
        <p className="text-xs text-zinc-500">
          Learner-led groups. Disciplers see progress and scores only, never answers.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="grid gap-0.5 rounded-sm bg-zinc-50 p-3">
            <dt className="text-[0.7rem] text-zinc-500">{stat.label}</dt>
            <dd className="ppc-heading text-base font-semibold text-zinc-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {overview.largestGroups.length > 0 ? (
        <ul className="grid gap-2 border-t border-zinc-100 pt-3">
          {overview.largestGroups.map((group) => (
            <li
              key={group.groupId}
              className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600"
            >
              <span className="grid gap-0.5">
                <span className="font-semibold text-zinc-900">
                  {group.leaderName}
                  {group.status === "archived" ? (
                    <span className="ml-2 font-normal text-amber-700">paused</span>
                  ) : null}
                </span>
                <span>
                  {group.leaderEmail} · {group.disciples} disciples · {group.prompts} check-ins
                </span>
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const next = group.status === "archived" ? "active" : "archived";
                  if (next === "active" || window.confirm(`Pause ${group.leaderName}'s group?`)) {
                    setStatus(group.groupId, next);
                  }
                }}
                className="text-[var(--color-brand-blue)] underline underline-offset-2 disabled:opacity-50"
              >
                {group.status === "archived" ? "Restore" : "Pause group"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500">No discipleship groups have disciples yet.</p>
      )}
      {message ? (
        <p role="status" className="text-xs text-zinc-600">
          {message}
        </p>
      ) : null}
    </section>
  );
}
