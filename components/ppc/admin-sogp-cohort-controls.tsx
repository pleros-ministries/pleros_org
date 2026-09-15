"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSogpCohort } from "@/app/admin/_actions/sogp-actions";
import { ADMIN_QUERY_KEYS, type AdminSogpData } from "@/lib/admin-query";
import { PRE_SOGP_PREPARATION_DAYS } from "@/lib/sogp/calendar";

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AdminSogpCohortControls({
  cohort,
}: {
  cohort: AdminSogpData["cohorts"][number];
}) {
  const queryClient = useQueryClient();
  const [startsAt, setStartsAt] = useState(() => toLocalDateTime(cohort.startsAt));
  const [endsAt, setEndsAt] = useState(() => toLocalDateTime(cohort.endsAt));
  const [telegramChannelUrl, setTelegramChannelUrl] = useState(() => cohort.telegramChannelUrl ?? "");
  const [telegramDiscussionUrl, setTelegramDiscussionUrl] = useState(() => cohort.telegramDiscussionUrl ?? "");
  const mutation = useMutation({
    mutationFn: async (input: Parameters<typeof updateSogpCohort>[0]) => {
      const result = await updateSogpCohort(input);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.sogp }),
  });

  return (
    <section className="grid gap-4 rounded-sm border border-zinc-200 bg-white p-4">
      <div>
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Cohort dates and status</h2>
        <p className="mt-1 text-xs text-zinc-500">Changing the start date requires rebuilding the {PRE_SOGP_PREPARATION_DAYS}-day preparation schedule.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">Starts<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="h-8 rounded-sm border border-zinc-200 px-2" /></label>
        <label className="grid gap-1 text-xs">Ends<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="h-8 rounded-sm border border-zinc-200 px-2" /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ cohortId: cohort.id, startsAt, endsAt })} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs font-medium">Save dates</button>
        <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ cohortId: cohort.id, status: "preparing" })} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs font-medium">Start preparation</button>
        <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ cohortId: cohort.id, status: "active" })} className="h-8 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-medium text-white">Activate cohort</button>
        <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ cohortId: cohort.id, status: "completed" })} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs font-medium">Complete cohort</button>
        {cohort.enrollmentClosesAt ? (
          <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ cohortId: cohort.id, enrollmentClosesAt: null })} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs font-medium">Reopen enrollment</button>
        ) : (
          <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ cohortId: cohort.id, enrollmentClosesAt: new Date().toISOString() })} className="h-8 rounded-sm border border-rose-200 px-3 text-xs font-medium text-rose-700">Close enrollment</button>
        )}
      </div>
      {cohort.enrollmentClosesAt ? (
        <p className="text-xs text-zinc-500">Enrollment closed {new Date(cohort.enrollmentClosesAt).toLocaleString()} — new signups skip this cohort.</p>
      ) : null}
      <div className="grid gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">
          Telegram channel URL
          <input type="url" placeholder="https://t.me/..." value={telegramChannelUrl} onChange={(event) => setTelegramChannelUrl(event.target.value)} className="h-8 rounded-sm border border-zinc-200 px-2" />
        </label>
        <label className="grid gap-1 text-xs">
          Telegram discussion URL
          <input type="url" placeholder="https://t.me/..." value={telegramDiscussionUrl} onChange={(event) => setTelegramDiscussionUrl(event.target.value)} className="h-8 rounded-sm border border-zinc-200 px-2" />
        </label>
      </div>
      <div>
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({
              cohortId: cohort.id,
              telegramChannelUrl: telegramChannelUrl.trim() || null,
              telegramDiscussionUrl: telegramDiscussionUrl.trim() || null,
            })
          }
          className="h-8 rounded-sm border border-zinc-200 px-3 text-xs font-medium"
        >
          Save Telegram links
        </button>
      </div>
      {mutation.error ? <p className="text-xs text-rose-700">{mutation.error.message}</p> : null}
      {mutation.data ? <p className="text-xs text-emerald-700">Cohort updated.</p> : null}
    </section>
  );
}
