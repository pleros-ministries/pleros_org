"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Headphones } from "lucide-react";

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sogp", "day", dayNumber] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "dashboard"] }),
      ]);
    },
  });

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-brand-sky)] p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Headphones className="size-5 text-[var(--color-brand-blue)]" /><span className="font-[var(--font-sen)] text-lg font-semibold text-[var(--color-text-strong)]">Teaching audio</span></div>
        {listened ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-lime)] px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--color-brand-blue)]"><Check className="size-3" /> Listened</span> : null}
      </div>
      <audio
        src={src}
        controls
        preload="metadata"
        className="w-full accent-[var(--color-brand-blue)]"
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          if (!notified.current && audio.duration > 0 && audio.currentTime / audio.duration >= 0.9) {
            notified.current = true;
            mutation.mutate();
          }
        }}
      />
      {listened ? (
        <p className="mt-3 text-xs leading-[1.45] text-[var(--color-text-muted)]">Your listening step completes automatically after 90% playback.</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs leading-[1.45] text-[var(--color-text-muted)]">Completes automatically after 90% playback, or downloaded the audio to listen elsewhere?</p>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => {
              notified.current = true;
              mutation.mutate();
            }}
            className="inline-flex h-8 shrink-0 items-center rounded-full border border-[var(--color-brand-blue)] px-3 text-xs font-semibold text-[var(--color-brand-blue)] disabled:opacity-50"
          >
            {mutation.isPending ? "Marking…" : "I've listened to this"}
          </button>
        </div>
      )}
    </div>
  );
}
