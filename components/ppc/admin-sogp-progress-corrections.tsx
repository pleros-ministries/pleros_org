"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  correctSogpPrayerCompletion,
  correctSogpPreparationCompletion,
  correctSogpReviewCompletion,
} from "@/app/admin/_actions/sogp-actions";
import { ADMIN_QUERY_KEYS, type AdminSogpData } from "@/lib/admin-query";

export function AdminSogpProgressCorrections({ data }: { data: AdminSogpData }) {
  const queryClient = useQueryClient();
  const [enrollmentId, setEnrollmentId] = useState(data.enrollments[0]?.id ?? 0);
  const [preparationDayId, setPreparationDayId] = useState(data.preparationDays[0]?.id ?? 0);
  const [dateKey, setDateKey] = useState("");
  const [liveClassId, setLiveClassId] = useState(data.liveClasses.find((item) => item.isRequired)?.id ?? 0);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.sogp });
  const preparationMutation = useMutation({ mutationFn: (complete: boolean) => correctSogpPreparationCompletion({ enrollmentId, preparationDayId, complete }), onSuccess: refresh });
  const prayerMutation = useMutation({ mutationFn: (complete: boolean) => correctSogpPrayerCompletion({ enrollmentId, dateKey, complete }), onSuccess: refresh });
  const reviewMutation = useMutation({ mutationFn: (complete: boolean) => correctSogpReviewCompletion({ enrollmentId, liveClassId, complete, source: "recording" }), onSuccess: refresh });
  const error = preparationMutation.error ?? prayerMutation.error ?? reviewMutation.error;

  return (
    <section className="grid gap-4 border-t border-zinc-100 px-4 py-4">
      <div>
        <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Correct learner progress</h3>
        <p className="mt-1 text-xs text-zinc-500">Use these scoped controls only when a learner’s recorded completion is incorrect.</p>
      </div>
      <label className="grid gap-1 text-xs">Learner<select value={enrollmentId} onChange={(event) => setEnrollmentId(Number(event.target.value))} className="h-8 rounded-sm border border-zinc-200 px-2">{data.enrollments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="grid gap-1 text-xs">Preparation lesson<select value={preparationDayId} onChange={(event) => setPreparationDayId(Number(event.target.value))} className="h-8 rounded-sm border border-zinc-200 px-2">{data.preparationDays.map((day) => <option key={day.id} value={day.id}>{day.publishDate} · {day.countdownLabel}</option>)}</select></label>
        <button type="button" onClick={() => preparationMutation.mutate(true)} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs">Mark complete</button>
        <button type="button" onClick={() => preparationMutation.mutate(false)} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs">Clear</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="grid gap-1 text-xs">Prayer Watch date<input type="date" value={dateKey} onChange={(event) => setDateKey(event.target.value)} className="h-8 rounded-sm border border-zinc-200 px-2" /></label>
        <button type="button" disabled={!dateKey} onClick={() => prayerMutation.mutate(true)} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs disabled:opacity-50">Mark complete</button>
        <button type="button" disabled={!dateKey} onClick={() => prayerMutation.mutate(false)} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs disabled:opacity-50">Clear</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="grid gap-1 text-xs">Review session<select value={liveClassId} onChange={(event) => setLiveClassId(Number(event.target.value))} className="h-8 rounded-sm border border-zinc-200 px-2">{data.liveClasses.filter((item) => item.isRequired).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <button type="button" disabled={!liveClassId} onClick={() => reviewMutation.mutate(true)} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs disabled:opacity-50">Mark complete</button>
        <button type="button" disabled={!liveClassId} onClick={() => reviewMutation.mutate(false)} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs disabled:opacity-50">Clear</button>
      </div>
      {error ? <p className="text-xs text-rose-700">{error.message}</p> : null}
    </section>
  );
}
