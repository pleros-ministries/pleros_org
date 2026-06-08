"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Teaching } from "@/lib/db/queries/teachings";
import { TeachingRow } from "./TeachingRow";

type Props = {
  initialTeachings: Teaching[];
};

export function AdminLibraryClient({ initialTeachings }: Props) {
  const router = useRouter();
  const [teachings, setTeachings] = useState(initialTeachings);

  async function handleDelete(id: number) {
    const res = await fetch(`/api/teachings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete teaching.");
      return;
    }
    setTeachings((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  }

  async function handleUpdate(
    id: number,
    data: { title: string; series: string; date: string },
  ) {
    const res = await fetch(`/api/teachings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      alert("Failed to update teaching.");
      return;
    }
    const updated: Teaching = await res.json();
    setTeachings((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-line)]">
      <table className="w-full min-w-[640px] border-collapse text-left text-[0.875rem]">
        <thead>
          <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Series</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-center">Audio</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachings.map((t) => (
            <TeachingRow
              key={t.id}
              teaching={t}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
          {teachings.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-text-muted)]">
                No teachings yet.{" "}
                <a href="/admin/library/upload" className="text-[var(--color-brand-blue)] underline">
                  Upload one
                </a>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
