"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import {
  deleteSogpPreparationDay,
  saveSogpPreparationDay,
  seedSogpPreparation,
  setSogpPreparationStatus,
} from "@/app/admin/_actions/sogp-actions";
import { ADMIN_QUERY_KEYS, type AdminSogpData } from "@/lib/admin-query";
import type { SogpPreparationResourceType } from "@/lib/sogp/types";

const resourceTypes: SogpPreparationResourceType[] = [
  "teaching",
  "podcast",
  "video",
  "reading",
  "gift",
  "announcement",
];

type ResourceDraft = {
  type: SogpPreparationResourceType;
  title: string;
  description: string;
  url: string;
};

const emptyResource = (): ResourceDraft => ({
  type: "teaching",
  title: "",
  description: "",
  url: "",
});

export function AdminSogpPreparation({
  cohortId,
  days,
}: {
  cohortId: number | null;
  days: AdminSogpData["preparationDays"];
}) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number>();
  const [publishDate, setPublishDate] = useState("");
  const [countdownLabel, setCountdownLabel] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [resources, setResources] = useState<ResourceDraft[]>([emptyResource()]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.sogp });
  }

  function reset() {
    setEditingId(undefined);
    setPublishDate("");
    setCountdownLabel("");
    setIntroduction("");
    setResources([emptyResource()]);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!cohortId) throw new Error("Create a cohort first.");
      return saveSogpPreparationDay({
        id: editingId,
        cohortId,
        publishDate,
        countdownLabel,
        introduction,
        resources,
      });
    },
    async onSuccess() {
      reset();
      await refresh();
    },
  });
  const statusMutation = useMutation({
    mutationFn: setSogpPreparationStatus,
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteSogpPreparationDay,
    onSuccess: refresh,
  });
  const seedMutation = useMutation({
    mutationFn: () => {
      if (!cohortId) throw new Error("Create a cohort first.");
      return seedSogpPreparation({ cohortId });
    },
    onSuccess: refresh,
  });

  function edit(day: AdminSogpData["preparationDays"][number]) {
    setEditingId(day.id);
    setPublishDate(day.publishDate);
    setCountdownLabel(day.countdownLabel);
    setIntroduction(day.introduction);
    setResources(
      day.resources.length
        ? day.resources.map((resource) => ({
            type: resource.type,
            title: resource.title,
            description: resource.description ?? "",
            url: resource.url,
          }))
        : [emptyResource()],
    );
  }

  function updateResource(index: number, patch: Partial<ResourceDraft>) {
    setResources((current) =>
      current.map((resource, itemIndex) =>
        itemIndex === index ? { ...resource, ...patch } : resource,
      ),
    );
  }

  function moveResource(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= resources.length) return;
    setResources((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  const mutationError =
    saveMutation.error ?? statusMutation.error ?? deleteMutation.error;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-semibold">Preparation schedule</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Published days become visible on the learner dashboard on their Lagos calendar date.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" disabled={!cohortId || seedMutation.isPending} onClick={() => seedMutation.mutate()} className="h-8 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-medium text-white disabled:opacity-50">
              {seedMutation.isPending ? "Building 30-day schedule…" : "Build approved 30-day schedule"}
            </button>
            <span className="text-[10px] text-zinc-500">{days.length}/30 preparation days</span>
          </div>
          {seedMutation.error ? <p className="mt-2 text-xs text-rose-700">{seedMutation.error.message}</p> : null}
        </div>
        <div className="divide-y divide-zinc-100">
          {days.length ? days.map((day) => (
            <article key={day.id} className="grid gap-3 px-4 py-4 text-xs sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-zinc-950">{day.publishDate}</span>
                  <span className={day.status === "published" ? "text-emerald-700" : "text-amber-700"}>{day.status}</span>
                </div>
                <p className="mt-1 font-medium text-zinc-800">{day.countdownLabel}</p>
                <p className="mt-1 text-zinc-500">{day.introduction}</p>
                <p className="mt-2 text-[10px] text-zinc-500">{day.resources.length} resource{day.resources.length === 1 ? "" : "s"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => edit(day)} className="h-8 rounded-sm border border-zinc-200 px-3 font-medium">Edit</button>
                <button type="button" onClick={() => statusMutation.mutate({ id: day.id, status: day.status === "published" ? "draft" : "published" })} className="h-8 rounded-sm border border-zinc-200 px-3 font-medium">{day.status === "published" ? "Unpublish" : "Publish"}</button>
                <button type="button" aria-label={`Delete ${day.countdownLabel}`} onClick={() => deleteMutation.mutate({ id: day.id })} className="grid size-8 place-items-center rounded-sm border border-rose-200 text-rose-700"><Trash2 className="size-3.5" /></button>
              </div>
            </article>
          )) : <p className="px-4 py-10 text-center text-xs text-zinc-500">No preparation days yet.</p>}
        </div>
      </section>

      <section className="rounded-sm border border-zinc-200 bg-white p-4">
        <h2 className="ppc-heading text-sm font-semibold">{editingId ? "Edit preparation day" : "Add preparation day"}</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-xs">Publication date<input type="date" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} className="h-9 rounded-sm border border-zinc-200 px-2" /></label>
          <label className="grid gap-1 text-xs">Countdown label<input value={countdownLabel} onChange={(event) => setCountdownLabel(event.target.value)} placeholder="12 days until SOGP" className="h-9 rounded-sm border border-zinc-200 px-2" /></label>
          <label className="grid gap-1 text-xs">Introduction<textarea value={introduction} onChange={(event) => setIntroduction(event.target.value)} rows={3} className="resize-y rounded-sm border border-zinc-200 p-2" /></label>

          <div className="grid gap-2 border-t border-zinc-100 pt-3">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold">Resources</p><button type="button" onClick={() => setResources((current) => [...current, emptyResource()])} className="inline-flex h-7 items-center gap-1 rounded-sm border border-zinc-200 px-2 text-[10px] font-medium"><Plus className="size-3" /> Add</button></div>
            {resources.map((resource, index) => (
              <div key={index} className="grid gap-2 rounded-sm border border-zinc-200 p-3">
                <div className="flex items-center gap-1">
                  <select value={resource.type} onChange={(event) => updateResource(index, { type: event.target.value as SogpPreparationResourceType })} className="h-8 min-w-0 flex-1 rounded-sm border border-zinc-200 px-2 text-xs">{resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                  <button type="button" aria-label="Move resource up" onClick={() => moveResource(index, -1)} className="grid size-8 place-items-center rounded-sm border border-zinc-200"><ArrowUp className="size-3" /></button>
                  <button type="button" aria-label="Move resource down" onClick={() => moveResource(index, 1)} className="grid size-8 place-items-center rounded-sm border border-zinc-200"><ArrowDown className="size-3" /></button>
                  <button type="button" aria-label="Remove resource" disabled={resources.length === 1} onClick={() => setResources((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="grid size-8 place-items-center rounded-sm border border-rose-200 text-rose-700 disabled:opacity-40"><Trash2 className="size-3" /></button>
                </div>
                <input value={resource.title} onChange={(event) => updateResource(index, { title: event.target.value })} placeholder="Resource title" className="h-8 rounded-sm border border-zinc-200 px-2 text-xs" />
                <input value={resource.url} onChange={(event) => updateResource(index, { url: event.target.value })} placeholder="https://… or /internal-path" className="h-8 rounded-sm border border-zinc-200 px-2 text-xs" />
                <textarea value={resource.description} onChange={(event) => updateResource(index, { description: event.target.value })} placeholder="Optional description" rows={2} className="resize-y rounded-sm border border-zinc-200 p-2 text-xs" />
              </div>
            ))}
          </div>

          {mutationError ? <p className="text-xs text-rose-700">{mutationError.message}</p> : null}
          <div className="flex gap-2">
            <button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} className="h-8 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-medium text-white disabled:opacity-50">{saveMutation.isPending ? "Saving" : "Save draft"}</button>
            {editingId ? <button type="button" onClick={reset} className="h-8 rounded-sm border border-zinc-200 px-3 text-xs font-medium">Cancel</button> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
