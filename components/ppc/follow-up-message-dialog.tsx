"use client";

import { useEffect, useState, useTransition } from "react";

import { recordFollowUpContact } from "@/app/admin/(app)/(pastor-only)/_actions/pastor-followup-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PastorEnrollee } from "@/lib/db/queries/pastor-followups";
import { buildFollowUpMessage } from "@/lib/sogp/follow-up-messages";
import { STUDENT_STATUS_META } from "@/lib/sogp/student-status";

const EMAIL_SUBJECT = "Checking in on your SOGP journey";

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

export function FollowUpMessageDialog({
  open,
  onOpenChange,
  enrollee,
  pastorUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollee: PastorEnrollee;
  pastorUserId: string | null;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const statusMeta = STUDENT_STATUS_META[enrollee.followUpStatus];

  useEffect(() => {
    if (open) {
      setMessage(buildFollowUpMessage(enrollee.followUpStatus, enrollee.firstName));
    }
  }, [open, enrollee.followUpStatus, enrollee.firstName]);

  function logAndClose(channel: "whatsapp" | "email") {
    startTransition(async () => {
      const result = await recordFollowUpContact({
        enrollmentId: enrollee.enrollmentId,
        channel,
        pastorUserId: pastorUserId ?? undefined,
      });
      if (result.error) {
        console.error("Could not log contact:", result.error);
      }
    });
    onOpenChange(false);
  }

  const actionButton =
    "inline-flex h-9 items-center gap-1.5 rounded-sm bg-[var(--color-brand-blue)] px-3.5 text-xs font-semibold text-white hover:opacity-90";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3">
        <DialogHeader>
          <DialogTitle>Follow up with {enrollee.firstName || enrollee.name}</DialogTitle>
          <DialogDescription>
            {statusMeta.emoji} {statusMeta.label} — edit this message before sending.
          </DialogDescription>
        </DialogHeader>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          className="w-full resize-y rounded-sm border border-zinc-200 p-3 text-sm leading-[1.6] outline-none focus-visible:border-[var(--color-brand-blue)]"
        />

        <DialogFooter className={pending ? "opacity-60" : ""}>
          {enrollee.whatsappConsent ? (
            <a
              href={`https://wa.me/${digitsOnly(enrollee.phone)}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => logAndClose("whatsapp")}
              className={actionButton}
            >
              Send via WhatsApp
            </a>
          ) : null}
          <a
            href={`mailto:${enrollee.email}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(message)}`}
            onClick={() => logAndClose("email")}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Send via email
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
