import { BookOpen, CalendarDays, MessageCircleMore, Radio, Sparkles } from "lucide-react";

import { HomepageFooter } from "@/components/home/homepage-footer";
import { HomepageNav } from "@/components/home/homepage-nav";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import { SogpEnrollmentForm } from "./sogp-enrollment-form";
import { SogpPublicQueryProvider } from "./sogp-public-query-provider";

const summary = [
  { label: "4 weeks", Icon: CalendarDays },
  { label: "20 tracks", Icon: BookOpen },
  { label: "Live classes", Icon: Radio },
  { label: "Telegram community", Icon: MessageCircleMore },
  { label: "Free enrolment", Icon: Sparkles },
];

export function SogpEnrollmentPage() {
  return (
    <PublicSitePageShell>
      <HomepageNav />
      <main className="site-font-theme bg-[var(--color-surface)]">
        <section className="border-b border-[var(--color-line)] bg-[var(--color-brand-sky)] py-12 md:py-16">
          <div className="site-shell-page">
            <p className="site-hero-eyebrow">School of God&apos;s Purpose</p>
          </div>
        </section>
        <section className="site-shell-page grid gap-10 py-12 md:grid-cols-[minmax(0,0.85fr)_minmax(26rem,1fr)] md:items-start md:gap-16 md:py-20">
          <div className="grid gap-8 md:sticky md:top-24">
            <div className="grid gap-4">
              <h1 className="site-hero-heading max-w-[12ch] text-[clamp(2.8rem,6vw,5rem)] text-[var(--color-brand-blue)]">Take your next step with SOGP</h1>
              <p className="site-section-intro max-w-[32rem] text-[var(--color-text-muted)]">Join a guided four-week journey into truth, spiritual growth, and God&apos;s purpose.</p>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-3 md:grid-cols-2">
              {summary.map(({ label, Icon }) => (
                <div key={label} className="flex min-h-24 items-center gap-3 bg-white p-4">
                  <Icon className="size-5 shrink-0 text-[var(--color-brand-blue)]" />
                  <span className="font-[var(--font-be-vietnam-pro)] text-xs font-semibold text-[var(--color-text-strong)]">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-md)] sm:p-7 md:p-8">
            <SogpPublicQueryProvider>
              <SogpEnrollmentForm />
            </SogpPublicQueryProvider>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
