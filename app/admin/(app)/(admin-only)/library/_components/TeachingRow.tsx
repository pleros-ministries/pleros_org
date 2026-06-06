"use client";

import { useState } from "react";
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from "lucide-react";

import type { Teaching } from "@/lib/db/queries/teachings";

type Props = {
  teaching: Teaching;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, data: { title: string; series: string; date: string }) => Promise<void>;
};

export function TeachingRow({ teaching, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(teaching.title);
  const [series, setSeries] = useState(teaching.series);
  const [date, setDate] = useState(teaching.date ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      await onUpdate(teaching.id, { title, series, date });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${teaching.title}"? This will also remove the audio file.`)) return;
    setBusy(true);
    try {
      await onDelete(teaching.id);
    } finally {
      setBusy(false);
    }
  }

  const hasAudio = teaching.audioUrl && !teaching.audioUrl.startsWith("placeholder");

  if (editing) {
    return (
      <tr className="border-b border-[var(--color-line)] bg-blue-50">
        <td className="px-4 py-2 text-[0.8125rem] text-muted-foreground">{teaching.sn}</td>
        <td className="px-4 py-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-input bg-white px-2 py-1 text-[0.875rem]"
          />
        </td>
        <td className="px-4 py-2">
          <input
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            className="w-full rounded border border-input bg-white px-2 py-1 text-[0.875rem]"
          />
        </td>
        <td className="px-4 py-2">
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="Mar 17, 2021"
            className="w-full rounded border border-input bg-white px-2 py-1 text-[0.875rem]"
          />
        </td>
        <td className="px-4 py-2 text-center">
          <span className={`inline-block h-2 w-2 rounded-full ${hasAudio ? "bg-green-500" : "bg-gray-300"}`} />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded bg-[var(--color-brand-blue)] px-2.5 py-1.5 text-[0.75rem] font-medium text-white hover:opacity-80 disabled:opacity-50"
            >
              <CheckIcon className="size-3.5" /> Save
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded bg-muted px-2.5 py-1.5 text-[0.75rem] font-medium hover:opacity-80 disabled:opacity-50"
            >
              <XIcon className="size-3.5" /> Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group border-b border-[var(--color-line)] hover:bg-[var(--color-cream-50)]">
      <td className="px-4 py-2.5 font-mono text-[0.75rem] text-[var(--color-text-muted)]">{teaching.sn}</td>
      <td className="max-w-[14rem] truncate px-4 py-2.5 text-[0.875rem] font-medium text-[var(--color-text-strong)]">
        {teaching.title}
      </td>
      <td className="px-4 py-2.5 text-[0.8125rem] text-[var(--color-text-muted)]">{teaching.series}</td>
      <td className="px-4 py-2.5 text-[0.8125rem] text-[var(--color-text-muted)]">{teaching.date ?? "—"}</td>
      <td className="px-4 py-2.5 text-center">
        <span
          title={hasAudio ? "Audio uploaded" : "No audio yet"}
          className={`inline-block h-2 w-2 rounded-full ${hasAudio ? "bg-green-500" : "bg-gray-300"}`}
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            disabled={busy}
            aria-label="Edit"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[0.75rem] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-line)] hover:text-[var(--color-text)]"
          >
            <PencilIcon className="size-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            aria-label="Delete"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[0.75rem] font-medium text-red-500 hover:bg-red-50"
          >
            <TrashIcon className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
