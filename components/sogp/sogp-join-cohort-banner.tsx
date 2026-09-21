"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type JoinCohortResponse = { redirectTo?: string; error?: string };

async function joinCohort(cohortId: number) {
  const response = await fetch("/api/sogp/enrol/join-cohort", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cohortId }),
  });
  const payload = (await response.json().catch(() => null)) as JoinCohortResponse | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "We could not complete your enrolment. Try again shortly.");
  }
  return payload;
}

function formatCohortStart(startsAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(startsAt));
}

export function SogpJoinCohortBanner({
  cohort,
}: {
  cohort: { id: number; title: string; startsAt: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => joinCohort(cohort.id),
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  return (
    <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-brand-sky-soft)] p-4">
      <div className="grid gap-0.5">
        <h2 className="font-[var(--font-sen)] text-sm font-semibold text-[var(--color-text-strong)]">
          Your next cohort is open
        </h2>
        <p className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] leading-[1.45] text-[var(--color-text-muted)]">
          {cohort.title} starts {formatCohortStart(cohort.startsAt)}.
        </p>
      </div>
      <Button
        size="sm"
        className="rounded-full bg-[var(--color-brand-blue)] text-white"
        onClick={() => setOpen(true)}
      >
        Join now
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {cohort.title}?</DialogTitle>
            <DialogDescription>
              This starts a new SOGP enrolment for {formatCohortStart(cohort.startsAt)}, using
              the same details from your last enrolment.
            </DialogDescription>
          </DialogHeader>
          {mutation.isError ? (
            <p role="alert" className="[font-size:0.8125rem] text-red-700">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "We could not complete your enrolment. Try again shortly."}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-[var(--color-brand-blue)] text-white"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {mutation.isPending ? "Joining" : "Yes, join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
