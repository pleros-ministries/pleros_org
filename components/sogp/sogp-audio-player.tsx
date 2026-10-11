"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Headphones } from "lucide-react";

import { LessonAudioControls } from "@/components/media/lesson-audio-controls";
import { ShareLearningProgressDialog } from "./share-learning-progress-dialog";

export function SogpAudioPlayer({
  dayNumber,
  src,
  listened,
}: {
  dayNumber: number;
  src: string;
  listened: boolean;
}) {
  const notified = useRef(listened);
  const wasAlreadyListened = useRef(listened);
  const [shareOpen, setShareOpen] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sogp/course/day/${dayNumber}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal: "audio" }),
      });
      if (!response.ok) throw new Error("Audio progress could not be saved");
    },
    async onSuccess() {
      if (!wasAlreadyListened.current) setShareOpen(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sogp", "day", dayNumber] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "dashboard"] }),
      ]);
    },
  });

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-brand-sky-soft)] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Headphones className="size-5 text-[var(--color-brand-blue)]" /><span className="font-[var(--font-sen)] text-[15px] font-medium text-[var(--color-text-strong)]">Teaching audio</span></div>
        {listened ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-lime)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--color-brand-blue)]"><Check className="size-3" /> Listened</span> : null}
      </div>
      <LessonAudioControls key={`${dayNumber}:${src}`} src={src} onProgress={(seconds, duration) => {
        if (!notified.current && Number.isFinite(duration) && duration > 0 && seconds / duration >= 0.9) {
          notified.current = true;
          mutation.mutate();
        }
      }} />
      {mutation.isError ? <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><p role="alert" className="text-(--destructive)">Listening progress could not be saved.</p><button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()} className="font-medium text-(--color-brand-blue) underline">Retry saving</button></div> : null}
      {listened ? (
        <p className="mt-3 text-xs leading-[1.45] text-[var(--color-text-muted)]">Listening completes automatically at 90%.</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs leading-[1.45] text-[var(--color-text-muted)]">Listening completes at 90%. Listened offline?</p>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => {
              notified.current = true;
              mutation.mutate();
            }}
            className="inline-flex h-8 shrink-0 items-center rounded-full border border-[var(--color-brand-blue)] px-3 text-xs font-medium text-[var(--color-brand-blue)] disabled:opacity-50"
          >
            {mutation.isPending ? "Marking…" : "I've listened to this"}
          </button>
        </div>
      )}
      <ShareLearningProgressDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        track="sogp"
        dayNumber={dayNumber}
      />
    </div>
  );
}
