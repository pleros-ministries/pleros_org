import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  MessageCircleMore,
} from "lucide-react";

import { HomepageFooter } from "@/components/home/homepage-footer";
import { HomepageNav } from "@/components/home/homepage-nav";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { sogpLandingContent as content } from "@/lib/sogp/landing-content";
import { SogpLandingAnalytics } from "./sogp-analytics";

function Cta({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href={content.hero.ctaHref}
      className={
        inverse
          ? "site-button-text inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
          : "site-button-text inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-px"
      }
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
        <section className="relative overflow-hidden bg-[var(--color-brand-sky)] text-[var(--color-brand-blue)]">
          <div className="site-shell-page sogp-shell-page grid min-h-[35rem] gap-10 pb-14 pt-28 md:min-h-[42rem] md:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] md:items-end md:pb-20">
            <div className="grid content-end gap-7">
              <p className="site-hero-eyebrow text-[var(--color-brand-indigo)]">
                {content.hero.eyebrow}
              </p>
              <div className="grid gap-5">
                <h1 className="site-hero-heading text-[clamp(2.8rem,6.5vw,5.8rem)] leading-[0.92] text-[var(--color-brand-blue)]">
                  {content.hero.title}
                </h1>
                <p className="max-w-[42rem] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.55] tracking-[-0.02em] text-[var(--color-text-muted)] md:text-[1.15rem]">
                  {content.hero.description}
                </p>
              </div>
              <Cta />
            </div>

            <div className="grid divide-y divide-[rgba(5,20,128,0.12)] overflow-hidden rounded-[var(--radius-md)] border border-[rgba(5,20,128,0.12)] bg-white/72 shadow-[var(--shadow-sm)]">
              {content.outcomes.map((outcome) => (
                <div key={outcome} className="grid grid-cols-[1.5rem_1fr] gap-3 p-4 md:p-5">
                  <span className="grid size-5 place-items-center rounded-full bg-[var(--color-brand-lime)]">
                    <Check className="size-3 text-[var(--color-brand-blue)]" />
                  </span>
                  <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.45] tracking-[-0.02em] text-[var(--color-text-strong)]">
                    {outcome}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="site-shell-page sogp-shell-page grid gap-5 py-20 md:grid-cols-[0.72fr_1.28fr] md:gap-14 md:py-28">
          <h2 className="site-section-heading text-[2.3rem] md:text-[3.25rem]">
            {content.definition.title}
          </h2>
          <p className="site-section-intro max-w-[44rem] text-[var(--color-text-muted)]">
            {content.definition.description}
          </p>
        </section>

        <section className="bg-[var(--color-surface-muted)] py-20 md:py-28">
          <div className="site-shell-page sogp-shell-page grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
            <h2 className="site-section-heading text-[2.3rem] md:text-[3.25rem]">
              Who needs to join SOGP
            </h2>
            <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
              {content.audiences.map((audience) => (
                <p
                  key={audience}
                  className="py-5 font-[var(--font-be-vietnam-pro)] text-[0.98rem] leading-[1.55] tracking-[-0.02em] text-[var(--color-text-strong)] md:text-[1.05rem]"
                >
                  {audience}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="site-shell-page sogp-shell-page grid gap-10 md:gap-14">
            <header className="flex flex-wrap items-end justify-between gap-5">
              <h2 className="site-section-heading text-[2.3rem] text-[var(--color-brand-blue)] md:text-[3.25rem]">
                {content.curriculum.title}
              </h2>
              <span className="site-button-text text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {content.curriculum.tracks.length} confirmed tracks
              </span>
            </header>

            <ol className="grid border-t border-[var(--color-line)] md:grid-cols-2">
              {content.curriculum.tracks.map((track, index) => (
                <li
                  key={`${track.level}-${track.title}`}
                  className="grid min-h-28 grid-cols-[2.75rem_1fr] gap-3 border-b border-[var(--color-line)] py-5 md:gap-5 md:odd:pr-8 md:even:border-l md:even:pl-8"
                >
                  <span className="font-[var(--font-sen)] text-sm font-semibold tabular-nums text-[var(--color-brand-blue)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="grid content-start gap-3">
                    <span className="w-fit rounded-full bg-[var(--color-brand-sky)] px-2.5 py-1 font-[var(--font-be-vietnam-pro)] text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand-blue)]">
                      {track.level}
                    </span>
                    <h3 className="font-[var(--font-sen)] text-[1.15rem] font-semibold leading-[1.2] tracking-[-0.035em] text-[var(--color-text-strong)] md:text-[1.3rem]">
                      {track.title}
                    </h3>
                  </div>
                </li>
              ))}
            </ol>

            <article className="grid gap-10 rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] p-6 text-white md:grid-cols-[0.72fr_1.28fr] md:gap-14 md:p-10">
              <div className="grid content-start gap-5">
                <BookOpen className="size-7 text-[var(--color-brand-lime)]" />
                <h2 className="site-section-heading text-[2rem] text-white md:text-[2.6rem]">
                  {content.structure.title}
                </h2>
              </div>
              <p className="site-section-intro self-end text-white/82">
                {content.structure.description}
              </p>
            </article>
          </div>
        </section>

        <section className="bg-[var(--color-brand-sky)] py-20 md:py-24">
          <div className="site-shell-page sogp-shell-page grid gap-8 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
            <h2 className="site-section-heading text-[2.3rem] text-[var(--color-brand-blue)] md:text-[3.25rem]">
              {content.enrollment.title}
            </h2>
            <div className="grid content-start justify-items-start gap-6">
              <p className="site-section-intro max-w-[44rem] text-[var(--color-text-muted)]">
                {content.enrollment.description}
              </p>
              <Cta />
            </div>
          </div>
        </section>

        <section className="site-shell-page sogp-shell-page grid gap-10 py-20 md:py-28">
          <h2 className="site-section-heading text-[2.3rem] md:text-[3.25rem]">
            {content.tools.title}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {content.tools.items.map((item, index) => {
              const Icon = index === 0 ? MessageCircleMore : BookOpen;
              return (
                <article
                  key={item}
                  className="grid min-h-52 content-between rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-sm)] md:p-8"
                >
                  <Icon className="size-7 text-[var(--color-brand-blue)]" />
                  <p className="font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-strong)]">
                    {item}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-[var(--color-brand-sky)] py-20 md:py-28">
          <div className="site-shell-page sogp-shell-page grid items-center gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
            <div className="grid gap-4">
              <p className="site-hero-eyebrow text-[var(--color-brand-indigo)]">
                School leadership
              </p>
              <h2 className="site-section-heading text-[2.3rem] text-[var(--color-brand-blue)] md:text-[3.25rem]">
                {content.facilitator.title}
              </h2>
            </div>

            <article className="grid overflow-hidden rounded-[var(--radius-md)] border border-[rgba(5,20,128,0.12)] bg-white shadow-[var(--shadow-sm)] sm:grid-cols-[minmax(13rem,0.72fr)_minmax(0,1fr)]">
              <div className="relative min-h-80 bg-[var(--color-surface-muted)] sm:min-h-[25rem]">
                <Image
                  src={content.facilitator.imageSrc}
                  alt={content.facilitator.name}
                  fill
                  sizes="(min-width: 768px) 32vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="grid content-center gap-7 p-6 md:p-9">
                <div className="grid gap-2">
                  <h3 className="site-section-heading text-[2rem] text-[var(--color-brand-blue)]">
                    {content.facilitator.name}
                  </h3>
                  <p className="font-[var(--font-be-vietnam-pro)] text-sm text-[var(--color-text-muted)]">
                    {content.facilitator.handle}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {content.facilitator.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${content.facilitator.name} on ${link.label}`}
                      className="grid size-11 place-items-center rounded-full bg-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
                    >
                      <Image
                        src={link.iconSrc}
                        alt=""
                        width={20}
                        height={20}
                      />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] py-20 md:py-28">
          <div className="site-shell-page sogp-shell-page grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
            <h2 className="site-section-heading text-[2.3rem] md:text-[3.25rem]">
              {content.benefits.title}
            </h2>
            <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
              {content.benefits.items.map((item) => (
                <p
                  key={item}
                  className="py-5 font-[var(--font-be-vietnam-pro)] text-[0.98rem] leading-[1.55] tracking-[-0.02em] text-[var(--color-text-strong)] md:text-[1.05rem]"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-brand-sky)] py-20 md:py-28">
          <div className="site-shell-page sogp-shell-page grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
            <div className="grid content-start gap-4">
              <p className="site-hero-eyebrow text-[var(--color-brand-indigo)]">
                Need to know
              </p>
              <h2 className="site-section-heading text-[2.3rem] text-[var(--color-brand-blue)] md:text-[3.25rem]">
                Frequently asked questions
              </h2>
            </div>

            <Accordion className="gap-3">
              {content.faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${index + 1}`}
                  className="rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-sm)]"
                >
                  <AccordionTrigger className="py-5 font-[var(--font-be-vietnam-pro)] text-[0.98rem] font-semibold leading-[1.4] md:text-[1.05rem]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="font-[var(--font-be-vietnam-pro)] text-[0.93rem] leading-[1.6] md:text-[0.98rem]">
                    <p>{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="bg-[var(--color-brand-blue)] py-14 text-white md:py-18">
          <div className="site-shell-page sogp-shell-page flex justify-center">
            <Cta inverse />
          </div>
        </section>
      </main>

      <HomepageFooter />
    </PublicSitePageShell>
  );
}
