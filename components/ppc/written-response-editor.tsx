"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ppc/status-badge";
import { saveDraft, submitWrittenResponse } from "@/app/ppc/_actions/submission-actions";

type Submission = {
  id: number;
  content: string;
  status: string;
  reviewerNote: string | null;
};

type WrittenResponseEditorProps = {
  userId: string;
  lessonId: number;
  existingSubmission: Submission | null;
};

export function WrittenResponseEditor({
  userId,
  lessonId,
  existingSubmission,
}: WrittenResponseEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(existingSubmission?.content ?? "");
  const [status, setStatus] = useState(existingSubmission?.status ?? "draft");
  const [reviewerNote] = useState(existingSubmission?.reviewerNote ?? null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        startSaveTransition(async () => {
          await saveDraft(userId, lessonId, value);
        });
      }, 2000);
    },
    [userId, lessonId],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    setContent(value);
    if (status === "draft" || status === "needs_revision") {
      debouncedSave(value);
    }
  };

  const handleSaveDraft = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    startSaveTransition(async () => {
      await saveDraft(userId, lessonId, content);
      router.refresh();
    });
  };

  const handleSubmit = () => {
    startSubmitTransition(async () => {
      await submitWrittenResponse(userId, lessonId);
      setStatus("submitted");
      router.refresh();
    });
  };

  const canEdit = status === "draft" || status === "needs_revision";
  const canSubmit = canEdit && content.trim().length > 0;

  const statusVariant = (() => {
    switch (status) {
      case "approved":
        return "success" as const;
      case "needs_revision":
        return "warning" as const;
      case "submitted":
        return "default" as const;
      default:
        return "default" as const;
    }
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <StatusBadge status={status} variant={statusVariant} />
        {isSaving && (
          <span className="text-[10px] text-zinc-400">Saving…</span>
        )}
      </div>

      {status === "needs_revision" && reviewerNote && (
        <div className="flex gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-amber-800">Revision requested</p>
            <p className="text-xs text-amber-700 leading-relaxed">{reviewerNote}</p>
          </div>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        disabled={!canEdit}
        rows={10}
        placeholder="Write your response…"
        className={cn(
          "w-full resize-y rounded-sm border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/50 transition-colors",
          !canEdit && "cursor-not-allowed bg-zinc-50 text-zinc-500",
        )}
      />

      {canEdit && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors",
              isSaving && "opacity-50",
            )}
          >
            <Save className="size-3.5" />
            Save draft
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-800",
              (!canSubmit || isSubmitting) && "opacity-50 cursor-not-allowed",
            )}
          >
            <Send className="size-3.5" />
            {isSubmitting
              ? "Submitting…"
              : status === "needs_revision"
                ? "Resubmit for review"
                : "Submit for review"}
          </button>
        </div>
      )}
    </div>
  );
}
