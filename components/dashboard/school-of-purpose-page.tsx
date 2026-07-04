import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { SchoolOfPurposeWaitlistForm } from "@/components/dashboard/school-of-purpose-waitlist-form";

type SchoolOfPurposePageProps = {
  existingEntry: { name: string; phone: string } | null;
};

export function SchoolOfPurposePage({ existingEntry }: SchoolOfPurposePageProps) {
  return (
    <section className="site-font-theme bg-[var(--color-surface)] pb-16 pt-5 sm:pb-20 sm:pt-6">
      <div className="container-pleros grid max-w-[36rem] gap-8">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1 font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-blue)]"
        >
          <ChevronLeftIcon className="size-4" />
          Back to dashboard
        </Link>

        <div className="grid gap-2">
          <h1 className="site-hero-heading max-w-[13ch] text-[clamp(2.4rem,6.2vw,3.45rem)] text-[var(--color-brand-blue)]">
            School of God&apos;s Purpose
          </h1>
          <p className="font-[var(--font-be-vietnam-pro)] max-w-[34ch] text-[0.95rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
            A weekly live teaching series helping you fulfill God&apos;s purpose.
          </p>
        </div>

        <div className="grid gap-3 rounded-[1.25rem] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="grid gap-1">
            <h2 className="site-section-heading text-[1.3rem] text-[var(--color-brand-blue)]">
              Join the waitlist
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.86rem] leading-[1.35] tracking-[-0.02em] text-[var(--color-text-muted)]">
              Share your name and WhatsApp number and we&apos;ll let you know
              when the next cohort opens.
            </p>
          </div>

          <SchoolOfPurposeWaitlistForm
            initialName={existingEntry?.name ?? ""}
            initialPhone={existingEntry?.phone ?? ""}
            alreadyJoined={existingEntry !== null}
          />
        </div>
      </div>
    </section>
  );
}
