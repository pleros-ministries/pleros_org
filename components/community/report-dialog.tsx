"use client";

import { useState, useTransition } from "react";

import type { CommunityActionResult } from "@/lib/community/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REASONS = [
  "Spam or advertising",
  "Harassment or bullying",
  "Inappropriate or offensive",
  "Misleading or false teaching",
  "Something else",
] as const;

/** Preset-reason report form shared by posts, comments and private messages. */
export function ReportDialog({
  open,
  onOpenChange,
  noun,
  note,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What is being reported: "post", "comment" or "message". */
  noun: string;
  /** Optional line on what moderators will see. */
  note?: string;
  onSubmit: (reason: string) => Promise<CommunityActionResult>;
}) {
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason(REASONS[0]);
      setDetail("");
      setError(null);
      setSent(false);
    }
    onOpenChange(next);
  }

  function submit() {
    setError(null);
    const extra = detail.trim();
    startTransition(async () => {
      try {
        const result = await onSubmit(extra ? `${reason}: ${extra}` : reason);
        if (result.ok) setSent(true);
        else setError(result.error);
      } catch {
        setError("Could not send your report. Try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="site-font-theme">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {sent ? "Report sent" : `Report this ${noun}`}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {sent
              ? "Thank you. A moderator will review it and you'll be notified of the outcome."
              : `Tell us what's wrong. The author won't know who reported it.${note ? ` ${note}` : ""}`}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <DialogFooter>
            <Button size="sm" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <fieldset className="grid gap-2">
              <legend className="sr-only">Reason</legend>
              {REASONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2.5 text-sm text-zinc-800"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={option}
                    checked={reason === option}
                    onChange={() => setReason(option)}
                    className="size-4 accent-[var(--color-brand-blue)]"
                  />
                  {option}
                </label>
              ))}
            </fieldset>

            <label className="grid gap-1 text-[13px] font-medium text-zinc-700">
              Anything to add? (optional)
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                rows={2}
                maxLength={300}
                className="resize-none rounded-xl border border-zinc-200 p-2.5 text-base font-normal outline-none focus:border-zinc-300 sm:text-sm"
              />
            </label>

            {error ? (
              <p role="alert" className="text-[13px] text-red-700">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Sending…" : "Send report"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
