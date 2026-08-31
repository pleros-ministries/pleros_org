"use client";

import { ArrowRight, BookOpen, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SOGP_PROMO_DISMISSED_KEY,
  shouldShowSogpPromo,
} from "@/lib/homepage-logic";

type HomepageSogpDrawerProps = {
  headline: string;
  question: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export function HomepageSogpDrawer({
  headline,
  question,
  body,
  ctaLabel,
  ctaHref,
}: HomepageSogpDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let shouldOpen = true;

    try {
      shouldOpen = shouldShowSogpPromo(
        window.localStorage.getItem(SOGP_PROMO_DISMISSED_KEY),
      );
    } catch {
      shouldOpen = true;
    }

    const openTimer = window.setTimeout(() => setOpen(shouldOpen), 0);
    return () => window.clearTimeout(openTimer);
  }, []);

  const rememberDismissal = () => {
    try {
      window.localStorage.setItem(SOGP_PROMO_DISMISSED_KEY, "1");
    } catch {
      // The sheet can still close when storage is unavailable.
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      rememberDismissal();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="site-font-theme gap-0 overflow-hidden rounded-t-[var(--radius-xl)] border-0 bg-white p-0 text-[var(--color-text)] shadow-[0_-28px_64px_rgba(6,16,86,0.18)] md:inset-x-auto md:right-auto md:bottom-auto md:top-1/2 md:left-1/2 md:w-[min(100%-2rem,36.1875rem)] md:max-h-[min(100vh-2rem,40rem)] md:overflow-y-auto md:rounded-[var(--radius-xl)] md:shadow-[0_24px_64px_rgba(6,16,86,0.2)] md:data-open:-translate-x-1/2 md:data-open:-translate-y-1/2 md:data-open:scale-100 md:data-closed:-translate-x-1/2 md:data-closed:-translate-y-1/2 md:data-closed:scale-95"
      >
        <div className="mx-auto w-full max-w-[36.1875rem]">
          <div className="relative bg-[var(--color-brand-sky-soft)] px-6 pb-7 pt-5 md:px-8 md:pb-8 md:pt-6">
            <SheetHeader className="relative gap-4 border-none pb-0 pr-0">
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(5,20,128,0.12)] bg-white/70 px-3 py-1.5 font-[var(--font-be-vietnam-pro)] text-[0.7rem] font-semibold tracking-[0.08em] text-[var(--color-brand-blue)] uppercase">
                  <BookOpen className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  School of God&apos;s Purpose
                </div>

                <SheetClose
                  render={
                    <button
                      type="button"
                      aria-label="Close SOGP invitation"
                      className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[rgba(5,20,128,0.12)] bg-white/70 text-[var(--color-brand-blue)] transition-colors duration-150 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                    />
                  }
                >
                  <X className="size-4.5" strokeWidth={2} aria-hidden="true" />
                </SheetClose>
              </div>

              <div className="grid gap-3">
                <SheetTitle className="font-[var(--font-sen)] text-[1.9rem] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--color-brand-blue)] md:text-[2.2rem]">
                  {headline}
                </SheetTitle>
                <SheetDescription className="max-w-[36ch] font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.55] text-[rgba(6,16,86,0.76)]">
                  {question}
                </SheetDescription>
              </div>
            </SheetHeader>
          </div>

          <div className="grid gap-5 px-6 pb-7 pt-6 md:px-8 md:pb-8 md:pt-7">
            <p className="max-w-[38ch] font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.6] text-[var(--color-text-muted)]">
              {body}
            </p>
            <Link
              href={ctaHref}
              prefetch={true}
              onClick={rememberDismissal}
              className="site-button-text inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(5,20,128,0.2)] transition-transform duration-150 hover:-translate-y-px hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-brand-blue)]"
            >
              {ctaLabel}
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
