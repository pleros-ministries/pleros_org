"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { validateEmail } from "@/lib/welcome-flow";
import { welcomePackModalCopy } from "@/lib/welcome-pack-modal-copy";

type WelcomePackModalProps = {
  openRequest: number;
};

export function WelcomePackModal({ openRequest }: WelcomePackModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    const openTimer = window.setTimeout(() => {
      setOpen(true);
    }, 0);

    return () => window.clearTimeout(openTimer);
  }, []);

  useEffect(() => {
    if (openRequest <= 0) {
      return undefined;
    }

    const openTimer = window.setTimeout(() => {
      setOpen(true);
    }, 0);

    return () => window.clearTimeout(openTimer);
  }, [openRequest]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/welcome-access", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ email: normalizedEmail }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: string; redirectTo?: string }
          | null;

        if (!response.ok || !payload?.redirectTo) {
          setError(payload?.error ?? "Something went wrong. Please try again.");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        window.location.href = payload.redirectTo;
      } catch {
        setError("Something went wrong. Please try again.");
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent tone="muted" className="overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(1,21,133,0.12),transparent_72%)]"
        />

        <DialogHeader className="relative gap-3">
          <div className="eyebrow">Welcome gift</div>
          <DialogTitle className="max-w-[18ch] text-balance">
            {welcomePackModalCopy.headline}
          </DialogTitle>
          <DialogDescription className="site-section-intro max-w-[46ch]">
            {welcomePackModalCopy.subheadline}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative grid gap-3">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            size="lg"
            variant="muted"
          />

          {error ? (
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Your email will also follow you into PPC when you are ready to onboard.
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || isPending}
          >
            {isSubmitting || isPending
              ? "Opening your dashboard..."
              : "Access the welcome pack"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
