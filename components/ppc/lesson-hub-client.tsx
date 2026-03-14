"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Headphones, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { markAudioListened, markNotesRead } from "@/app/ppc/_actions/lesson-actions";

type LessonHubClientProps = {
  userId: string;
  lessonId: number;
  audioListened: boolean;
  notesRead: boolean;
};

export function LessonHubClient({
  userId,
  lessonId,
  audioListened,
  notesRead,
}: LessonHubClientProps) {
  const router = useRouter();
  const [audioPending, startAudioTransition] = useTransition();
  const [notesPending, startNotesTransition] = useTransition();

  const handleAudio = () => {
    startAudioTransition(async () => {
      await markAudioListened(userId, lessonId);
      router.refresh();
    });
  };

  const handleNotes = () => {
    startNotesTransition(async () => {
      await markNotesRead(userId, lessonId);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleAudio}
        disabled={audioPending || audioListened}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-sm border px-2 text-xs font-medium transition-colors",
          audioListened
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
          audioPending && "opacity-50",
        )}
      >
        <Headphones className="size-3" />
        {audioListened ? "Audio listened" : "Mark audio listened"}
      </button>

      <button
        type="button"
        onClick={handleNotes}
        disabled={notesPending || notesRead}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-sm border px-2 text-xs font-medium transition-colors",
          notesRead
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
          notesPending && "opacity-50",
        )}
      >
        <FileText className="size-3" />
        {notesRead ? "Notes read" : "Mark notes read"}
      </button>
    </div>
  );
}
