import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CircleHelp,
  Globe2,
  GraduationCap,
  MessageCircleMore,
  Radio,
  Sparkles,
} from "lucide-react";

import { HomepageFooter } from "@/components/home/homepage-footer";
import { HomepageNav } from "@/components/home/homepage-nav";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import { sogpLandingContent as content } from "@/lib/sogp/landing-content";
import { SogpLandingAnalytics } from "./sogp-analytics";

const featureIcons = [CircleHelp, Sparkles, GraduationCap, Radio, ArrowRight];

function Cta({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href={content.hero.ctaHref}
      className={inverse
        ? "site-button-text inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
        : "site-button-text inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-px"}
    >
      {content.hero.ctaLabel}
      <ArrowRight className="size-4" />
    </Link>
  );
}

export function SogpLandingPage() {
  return (
    <PublicSitePageShell>
      <HomepageNav />
      <SogpLandingAnalytics />
      <main className="site-font-theme bg-white">
        <section className="relative overflow-hidden bg-[var(--color-brand-blue)] text-white">
          <div className="site-shell-page sogp-shell-page relative grid min-h-[34rem] content-end gap-10 pb-14 pt-28 md:min-h-[40rem] md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] md:items-end md:pb-20">
            <div className="grid max-w-[44rem] gap-7">
              <p className="site-hero-eyebrow text-[var(--color-brand-lime)]">
                {content.hero.eyebrow}
              </p>
              <div className="grid gap-5">
                <h1 className="site-hero-heading text-[clamp(3rem,7vw,6.4rem)] leading-[0.88] text-white">
                  Find truth.
                  <br />
                  Discover purpose.
                </h1>
                <p className="max-w-[39rem] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.55] tracking-[-0.02em] text-white/84 md:text-[1.15rem]">
                  {content.hero.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Cta inverse />
                <span className="font-[var(--font-be-vietnam-pro)] text-xs font-medium text-white/70">
                  Free · Four weeks · Worldwide
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] bg-white/15 ring-1 ring-white/15">
              {[
                ["28", "days"],
                ["20", "guided tracks"],
                ["4", "live classes"],
                ["1", "shared journey"],
              ].map(([value, label]) => (
                <div key={label} className="grid min-h-28 content-end gap-1 bg-white/8 p-5 backdrop-blur-sm">
                  <strong className="font-[var(--font-sen)] text-3xl tracking-[-0.06em]">{value}</strong>
                  <span className="font-[var(--font-be-vietnam-pro)] text-xs text-white/72">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-brand-lime)] py-5 text-[var(--color-brand-blue)]">
          <div className="site-shell-page sogp-shell-page flex flex-wrap items-center justify-between gap-x-6 gap-y-3 font-[var(--font-be-vietnam-pro)] text-xs font-semibold uppercase tracking-[0.12em]">
            <span>Truth</span><span>Purpose</span><span>Transformation</span><span>Community</span><span>Action</span>
          </div>
        </section>

        <section className="site-shell-page sogp-shell-page grid gap-12 py-20 md:grid-cols-[0.8fr_1.2fr] md:py-28">
          <div className="grid content-start gap-3">
            <p className="site-hero-eyebrow">What you gain</p>
            <h2 className="site-section-heading text-[2.3rem] md:text-[3.2rem]">Clarity that changes how you live</h2>
          </div>
          <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
            {content.outcomes.map((outcome, index) => {
              const Icon = featureIcons[index] ?? Check;
              return (
                <div key={outcome} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 md:py-6">
                  <Icon className="mt-0.5 size-5 text-[var(--color-brand-blue)]" />
                  <p className="font-[var(--font-be-vietnam-pro)] text-[0.96rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-strong)] md:text-[1.05rem]">{outcome}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] py-20 md:py-28">
          <div className="site-shell-page sogp-shell-page grid gap-12 lg:grid-cols-[1fr_1.15fr]">
            <div className="grid content-start gap-5">
              <p className="site-hero-eyebrow">What is SOGP?</p>
              <h2 className="site-section-heading text-[2.3rem] md:text-[3.25rem]">{content.definition.title}</h2>
              <p className="site-section-intro max-w-[36rem] text-[var(--color-text-muted)]">{content.definition.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {content.audiences.map((audience, index) => (
                <div key={audience} className="grid min-h-36 content-between rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-sm)]">
                  <span className="font-[var(--font-sen)] text-sm font-semibold text-[var(--color-brand-blue)]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.45] tracking-[-0.02em] text-[var(--color-text-strong)]">{audience}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="site-shell-page sogp-shell-page grid gap-12 py-20 md:py-28">
          <div className="grid max-w-[43rem] gap-4">
            <p className="site-hero-eyebrow">Course structure</p>
            <h2 className="site-section-heading text-[2.3rem] md:text-[3.25rem]">{content.structure.title}</h2>
            <p className="site-section-intro text-[var(--color-text-muted)]">{content.structure.description}</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-line)] md:grid-cols-4">
            {content.curriculum.map((week) => (
              <div key={week.label} className="grid min-h-44 content-between bg-white p-5">
                <span className="font-[var(--font-be-vietnam-pro)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">{week.label}</span>
                <h3 className="font-[var(--font-sen)] text-xl font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--color-text-strong)]">{week.title}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[var(--color-brand-sky)] py-20 md:py-24">
          <div className="site-shell-page sogp-shell-page grid gap-8 md:grid-cols-2">
            {content.tools.map((tool, index) => {
              const Icon = index === 0 ? MessageCircleMore : BookOpen;
              return (
                <article key={tool.name} className="grid min-h-64 content-between rounded-[var(--radius-md)] border border-[rgba(6,16,86,0.1)] bg-white p-6 md:p-8">
                  <Icon className="size-8 text-[var(--color-brand-blue)]" />
                  <div className="grid gap-2">
                    <h2 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.05em] text-[var(--color-brand-blue)]">{tool.name}</h2>
                    <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.5] text-[var(--color-text-muted)]">{tool.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="site-shell-page sogp-shell-page grid gap-8 py-20 md:grid-cols-4 md:py-24">
          {content.benefits.map((benefit, index) => {
            const Icon = [Globe2, CalendarDays, MessageCircleMore, Sparkles][index] ?? Check;
            return (
              <div key={benefit.title} className="grid content-start gap-4 border-t border-[var(--color-line)] pt-5">
                <Icon className="size-5 text-[var(--color-brand-blue)]" />
                <div className="grid gap-2">
                  <h3 className="font-[var(--font-sen)] text-lg font-semibold tracking-[-0.04em] text-[var(--color-text-strong)]">{benefit.title}</h3>
                  <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.5] text-[var(--color-text-muted)]">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="bg-[var(--color-brand-blue)] py-20 text-white md:py-28">
          <div className="site-shell-page sogp-shell-page grid justify-items-start gap-7 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid max-w-[46rem] gap-4">
              <p className="site-hero-eyebrow text-[var(--color-brand-lime)]">Start your journey</p>
              <h2 className="site-section-heading text-[2.5rem] text-white md:text-[4rem]">Ready to find truth and walk in purpose?</h2>
            </div>
            <Cta inverse />
          </div>
        </section>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
