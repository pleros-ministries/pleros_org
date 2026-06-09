"use client";

import {
  GiftIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  WELCOME_PACK_STORAGE_KEY,
  serializeWelcomePackState,
  shouldShowWelcomePackModal,
} from "@/lib/homepage-logic";
import { validateEmail } from "@/lib/welcome-flow";

type HomepageGiftDrawerProps = {
  hasWelcomeAccess: boolean;
  autoOpen?: boolean;
  redirectTo?: string;
  triggerLabel?: string;
  submitLabel?: string;
  pendingLabel?: string;
};

export function HomepageGiftDrawer({
  hasWelcomeAccess,
  autoOpen = true,
  redirectTo = "/dashboard",
  triggerLabel,
  submitLabel = "access welcome pck",
  pendingLabel = "Opening your dashboard",
}: HomepageGiftDrawerProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasCompletedRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    if (!autoOpen || hasWelcomeAccess) {
      return undefined;
    }

    const storedState = window.localStorage.getItem(WELCOME_PACK_STORAGE_KEY);

    if (!shouldShowWelcomePackModal(storedState)) {
      return;
    }

    const openTimer = window.setTimeout(() => {
      setOpen(true);
    }, 0);

    return () => window.clearTimeout(openTimer);
  }, [autoOpen, hasWelcomeAccess]);

  const persistDismissedState = () => {
    if (hasCompletedRef.current) {
      return;
    }

    window.localStorage.setItem(
      WELCOME_PACK_STORAGE_KEY,
      serializeWelcomePackState({
        status: "dismissed",
        updatedAt: new Date().toISOString(),
      }),
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      persistDismissedState();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/welcome-access", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, returnTo: redirectTo }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.redirectTo) {
        setError(payload?.error ?? "Something went wrong. Please try again.");
        return;
      }

      window.localStorage.setItem(
        WELCOME_PACK_STORAGE_KEY,
        serializeWelcomePackState({
          status: "completed",
          email: normalizedEmail,
          updatedAt: new Date().toISOString(),
        }),
      );

      hasCompletedRef.current = true;
      setOpen(false);
      window.location.href = payload.redirectTo;
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {triggerLabel ? (
        <SheetTrigger
          render={
            <button
              type="button"
              className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] leading-none font-semibold text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)] transition-transform duration-150 hover:-translate-y-px hover:text-white focus-visible:text-white"
            />
          }
        >
          {triggerLabel}
        </SheetTrigger>
      ) : null}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="site-font-theme gap-0 rounded-t-[1.75rem] border-x-0 border-b-0 bg-[linear-gradient(180deg,#f7faff_0%,#ffffff_48%)] px-0 pb-0 pt-0 text-[var(--color-text)] shadow-[0_-28px_64px_rgba(6,16,86,0.18)]"
      >
        <div className="mx-auto grid w-full max-w-[36.1875rem] gap-5 px-5 pb-6 pt-4">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[var(--color-brand-blue)] px-4 pb-5 pt-4 text-white shadow-[0_18px_40px_rgba(6,16,86,0.2)]">

            <SheetHeader className="relative gap-4 border-none pb-0 pr-0">
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.08em] text-white/92 uppercase">
                  <GiftIcon className="size-3.5" />
                  Welcome gift
                </div>

                <SheetClose
                  render={
                    <button
                      type="button"
                      aria-label="Close gift drawer"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/8 text-white/88 transition-colors duration-150 hover:bg-white/14 hover:text-white"
                    />
                  }
                >
                  <XIcon className="size-4.5 stroke-[2.2]" />
                </SheetClose>
              </div>

              <div className="grid gap-2">
                <SheetTitle className="font-[var(--font-sen)] text-[1.9rem] font-semibold leading-[0.92] tracking-[-0.05em] text-white">
                  Get your free welcome pack
                </SheetTitle>
                <p className="max-w-[26ch] font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.3] tracking-[-0.02em] text-white/82">
                  The first resources you need to begin your Pleros journey are
                  waiting inside your dashboard.
                </p>
              </div>
            </SheetHeader>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-3 rounded-[1.35rem] border border-[rgba(6,16,86,0.08)] bg-white px-4 py-4 shadow-[0_16px_34px_rgba(6,16,86,0.08)]"
          >
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              className="h-12 rounded-[1rem] border-[rgba(6,16,86,0.12)] bg-[var(--color-surface)] px-4 text-[var(--text-body)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
            />

            {error ? (
              <p className="text-[0.8125rem] font-medium leading-[1.25] text-[var(--destructive)]">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="site-button-text min-h-[2.875rem] w-full rounded-full px-6 py-2.5 text-[0.875rem] text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)] hover:text-white focus-visible:text-white"
            >
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
