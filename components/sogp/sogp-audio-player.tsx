"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
    <div className="min-w-0 rounded-[10px] bg-[var(--color-brand-sky-soft)] p-3.5 sm:p-4">
      <LessonAudioControls key={`${dayNumber}:${src}`} src={src} onProgress={(seconds, duration) => {
        if (!notified.current && Number.isFinite(duration) && duration > 0 && seconds / duration >= 0.9) {
          notified.current = true;
          mutation.mutate();
        }
      }} />
      {mutation.isError ? <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><p role="alert" className="text-(--destructive)">Listening progress could not be saved.</p><button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()} className="font-medium text-(--color-brand-blue) underline">Retry saving</button></div> : null}
      <ShareLearningProgressDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        track="sogp"
        dayNumber={dayNumber}
      />
    </div>
  );
}
