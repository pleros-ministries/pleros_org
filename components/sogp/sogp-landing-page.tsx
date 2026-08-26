import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Radio,
  RotateCcw,
} from "lucide-react";

import { HomepageFooter } from "@/components/home/homepage-footer";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getSogpCurriculumLevels,
  sogpLandingContent as content,
} from "@/lib/sogp/landing-content";
import { SogpLandingAnalytics } from "./sogp-analytics";
import { SogpHeroPhone } from "./sogp-hero-phone";
import { SogpCurriculumAccordion } from "./sogp-curriculum-accordion";

function SectionCta({
  label,
  inverse = false,
}: {
  label: string;
  inverse?: boolean;
}) {
  return (
    <Link
      href={content.hero.ctaHref}
      className={
        inverse
          ? "site-button-text inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          : "site-button-text inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-blue)]"
      }
    >
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

const structureIcons = [CalendarDays, Radio, Clock3, RotateCcw] as const;

function CurriculumSection() {
  const curriculumLevels = getSogpCurriculumLevels();

  return (
    <section className="py-14 md:py-20">
      <div className="site-shell-page sogp-shell-page grid gap-8">
        <div className="grid gap-4 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
          <h2 className="site-section-heading text-[2.35rem] text-[var(--color-brand-blue)] md:text-[3.4rem]">
            {content.curriculum.title}
          </h2>
          <p className="site-section-intro text-[var(--color-text-muted)]">
            {content.curriculum.description}
          </p>
        </div>
        <SogpCurriculumAccordion levels={curriculumLevels} />
        <SectionCta label={content.ctas.curriculum} />
      </div>
    </section>
  );
}

function StructureSection() {
  return (
    <section className="bg-[var(--color-brand-blue)] py-14 text-white md:py-20">
      <div className="site-shell-page sogp-shell-page grid gap-9">
        <div className="grid gap-4 md:grid-cols-[0.7fr_1.3fr] md:gap-14">
          <h2 className="site-section-heading text-[2.35rem] text-white md:text-[3.4rem]">
            {content.structure.title}
          </h2>
          <p className="site-section-intro text-white/78">
            {content.structure.description}
          </p>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-white/18 bg-white">
          {content.structure.schedule.map((item, index) => {
            const Icon = structureIcons[index];
            return (
              <div
                key={item.label}
                className="grid gap-3 border-b border-[var(--color-line)] p-5 last:border-b-0 sm:grid-cols-[2.25rem_9rem_1fr] sm:items-center md:p-6"
              >
                <Icon
                  className="size-5 text-[var(--color-brand-blue)]"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-[var(--font-sen)] text-lg font-semibold tracking-[-0.035em] text-[var(--color-brand-blue)]">
                    {item.label}
                  </p>
                  <p className="font-[var(--font-be-vietnam-pro)] text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    {item.meta}
                  </p>
                </div>
                <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.5] text-[var(--color-text-strong)]">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>
        <SectionCta label={content.ctas.middle} inverse />
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section className="py-14 md:py-20">
      <div className="site-shell-page sogp-shell-page grid gap-9">
        <h2 className="site-section-heading max-w-[13ch] text-[2.35rem] md:text-[3.4rem]">
          {content.tools.title}
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <article className="overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] text-white">
            <div className="grid min-h-64 content-center gap-5 p-6 md:p-8">
              <div className="grid size-16 place-items-center rounded-full bg-white/12">
                <Image
                  src={content.tools.items[0].iconSrc}
                  alt=""
                  width={34}
                  height={34}
                />
              </div>
              <div className="grid max-w-[18rem] gap-2">
                <div className="w-[82%] rounded-[0.8rem] rounded-bl-[0.2rem] bg-white px-4 py-3 text-xs leading-[1.45] text-[var(--color-brand-blue)]">
                  Your next SOGP track is ready.
                </div>
                <div className="ml-auto w-[72%] rounded-[0.8rem] rounded-br-[0.2rem] bg-[var(--color-brand-sky)] px-4 py-3 text-xs leading-[1.45] text-[var(--color-brand-blue)]">
                  I’m ready to continue.
                </div>
              </div>
            </div>
            <div className="grid gap-2 border-t border-white/14 p-6 md:p-8">
              <h3 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.04em]">
                {content.tools.items[0].title}
              </h3>
              <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.55] text-white/76">
                {content.tools.items[0].description}
              </p>
            </div>
          </article>

          <article className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-sm)]">
            <div className="relative min-h-64 overflow-hidden">
              <Image
                src={content.tools.items[1].imageSrc}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-5 grid content-between rounded-[0.75rem] border border-white/70 bg-white/88 p-4 shadow-[0_18px_45px_rgba(5,20,128,0.14)] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] pb-3">
                  <span className="font-[var(--font-sen)] text-sm font-semibold text-[var(--color-brand-blue)]">
                    School of God’s Purpose
                  </span>
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Week 1
                  </span>
                </div>
                <div className="grid gap-2">
                  {["Today’s track", "Assessment", "Formation progress"].map(
                    (label, index) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 rounded-[0.45rem] bg-[var(--color-brand-sky)] px-3 py-2.5"
                      >
                        <span className="grid size-5 place-items-center rounded-full bg-[var(--color-brand-blue)] text-[0.6rem] font-semibold text-white">
                          {index + 1}
                        </span>
                        <span className="text-xs font-medium text-[var(--color-text-strong)]">
                          {label}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-2 p-6 md:p-8">
              <h3 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.04em] text-[var(--color-brand-blue)]">
                {content.tools.items[1].title}
              </h3>
              <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.55] text-[var(--color-text-muted)]">
                {content.tools.items[1].description}
              </p>
            </div>
          </article>
        </div>
        <SectionCta label={content.ctas.middle} />
      </div>
    </section>
  );
}

export function SogpLandingPage() {
  const schoolName = content.hero.titleLines[3].replace(/^with the /, "");

  return (
    <PublicSitePageShell>
      <SogpLandingAnalytics />

      <main className="site-font-theme bg-white">
        <section className="bg-white">
          <div className="site-shell-page sogp-shell-page grid gap-8 pb-14 pt-10 lg:max-w-none lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] lg:items-center lg:gap-12 lg:pb-20 lg:pt-12">
            <div className="grid min-w-0 gap-7">
              <h1 className="site-hero-heading max-w-[18ch] text-[clamp(2.65rem,5vw,4.65rem)] leading-[0.96] text-[var(--color-brand-blue)]">
                {content.hero.titleLines.slice(0, 3).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                <span className="mt-3 block text-[0.46em] leading-[1.05] tracking-[-0.035em] text-[var(--color-text-muted)] md:mt-5">
                  with the
                </span>
                <span className="mt-2 inline-block bg-[var(--color-brand-sky)] px-3 py-2 text-[0.58em] leading-[1.05] tracking-[-0.045em] text-[var(--color-brand-blue)] md:px-5 md:py-3">
                  {schoolName}
                </span>
              </h1>
              <p className="max-w-[42rem] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.6] tracking-[-0.02em] text-[var(--color-text-muted)] md:text-[1.15rem]">
                {content.hero.description}
              </p>
              <SectionCta label={content.ctas.hero} />
            </div>
            <SogpHeroPhone />
          </div>
        </section>

        <section className="bg-[var(--color-brand-sky)] py-14 md:py-20">
          <div className="site-shell-page sogp-shell-page grid gap-8">
            <h2 className="site-section-heading max-w-[13ch] text-[2.35rem] text-[var(--color-brand-blue)] md:text-[3.4rem]">
              {content.questionsTitle}
            </h2>
            <ol className="grid border-t border-[rgba(5,20,128,0.16)] md:grid-cols-2">
              {content.questions.map((question, index) => (
                <li
                  key={question}
                  className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-[rgba(5,20,128,0.16)] pb-4 pt-5 md:min-h-36 md:gap-5 md:py-5 md:odd:pr-8 md:even:border-l md:even:pl-8"
                >
                  <span className="font-[var(--font-sen)] text-sm font-semibold tabular-nums text-[var(--color-brand-blue)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="font-[var(--font-sen)] text-[1.18rem] font-semibold leading-[1.28] tracking-[-0.035em] text-[var(--color-text-strong)] md:text-[1.35rem]">
                    {question}
                  </p>
                </li>
              ))}
            </ol>
            <SectionCta label={content.ctas.early} />
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="site-shell-page sogp-shell-page grid gap-10 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
            <div className="grid content-start gap-5">
              <h2 className="site-section-heading text-[2.35rem] md:text-[3.4rem]">
                {content.definition.title}
              </h2>
              <div className="grid gap-4">
                {content.definition.description
                  .split(/(?<=\.)\s+(?=[A-Z])/)
                  .map((paragraph) => (
                    <p
                      key={paragraph}
                      className="site-section-intro text-[var(--color-text-muted)]"
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>
            <div className="grid content-start gap-4">
              <p className="font-[var(--font-sen)] text-xl font-semibold tracking-[-0.035em] text-[var(--color-brand-blue)]">
                {content.definition.outcomesIntro}
              </p>
              <ul className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
                {content.outcomes.map((outcome) => (
                  <li key={outcome} className="grid grid-cols-[1.5rem_1fr] gap-3 py-4">
                    <span className="mt-0.5 grid size-5 place-items-center rounded-full bg-[var(--color-brand-lime)]">
                      <Check className="size-3 text-[var(--color-brand-blue)]" aria-hidden="true" />
                    </span>
                    <span className="font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.55] text-[var(--color-text-strong)]">
                      {outcome}
                    </span>
                  </li>
                ))}
              </ul>
              <SectionCta label={content.ctas.middle} />
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] py-14 md:py-20">
          <div className="site-shell-page sogp-shell-page grid gap-9">
            <h2 className="site-section-heading max-w-[13ch] text-[2.35rem] md:text-[3.4rem]">
              Who should join SOGP?
            </h2>
            <ol className="grid gap-x-10 border-t border-[var(--color-line)] md:grid-cols-2">
              {content.audiences.map((audience, index) => (
                <li
                  key={audience}
                  className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-[var(--color-line)] py-4"
                >
                  <span className="font-[var(--font-sen)] text-sm font-semibold text-[var(--color-brand-blue)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-[var(--font-be-vietnam-pro)] text-[0.94rem] leading-[1.55] text-[var(--color-text-strong)]">
                    {audience}
                  </span>
                </li>
              ))}
            </ol>
            <SectionCta label={content.ctas.middle} />
          </div>
        </section>

        <CurriculumSection />
        <StructureSection />

        <section className="bg-[var(--color-brand-sky)] py-14 md:py-20">
          <div className="site-shell-page sogp-shell-page grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:gap-14">
            <h2 className="site-section-heading text-[2.35rem] text-[var(--color-brand-blue)] md:text-[3.4rem]">
              {content.enrollment.title}
            </h2>
            <div className="grid content-start gap-5">
              {content.enrollment.paragraphs.map((paragraph, index) => (
                <p
                  key={paragraph}
                  className={
                    index === 1
                      ? "border-l-4 border-[var(--color-brand-lime)] bg-white p-5 font-[var(--font-be-vietnam-pro)] text-[0.98rem] font-medium leading-[1.62] text-[var(--color-text-strong)]"
                      : "font-[var(--font-be-vietnam-pro)] text-[0.98rem] leading-[1.62] text-[var(--color-text-muted)]"
                  }
                >
                  {paragraph}
                </p>
              ))}
              <SectionCta label={content.ctas.free} />
            </div>
          </div>
        </section>

        <ToolsSection />

        <section className="bg-[var(--color-brand-sky)] py-14 md:py-20">
          <div className="site-shell-page sogp-shell-page grid gap-9 md:grid-cols-[0.85fr_1.15fr] md:items-center md:gap-14">
            <div className="relative min-h-[25rem] overflow-hidden rounded-[var(--radius-md)] bg-white md:min-h-[36rem]">
              <Image
                src={content.facilitator.imageSrc}
                alt={content.facilitator.name}
                fill
                sizes="(min-width: 768px) 42vw, 100vw"
                className="object-cover object-top"
              />
            </div>
            <div className="grid content-center gap-5">
              <p className="site-hero-eyebrow text-[var(--color-brand-indigo)]">
                {content.facilitator.title}
              </p>
              <h2 className="site-section-heading text-[2.35rem] text-[var(--color-brand-blue)] md:text-[3.4rem]">
                {content.facilitator.name}
              </h2>
              <p className="site-section-intro text-[var(--color-text-strong)]">
                {content.facilitator.description}
              </p>
              <SectionCta label={content.ctas.free} />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[var(--color-brand-blue)] py-16 text-white md:py-24">
          <Image
            src={content.socialProof.imageSrc}
            alt=""
            fill
            sizes="100vw"
            className="object-cover grayscale"
          />
          <div className="absolute inset-0 bg-[rgba(0,14,104,0.78)]" />
          <div className="site-shell-page sogp-shell-page relative grid max-w-[54rem] gap-6">
            <h2 className="site-section-heading text-[2.45rem] text-white md:text-[3.8rem]">
              {content.socialProof.title}
            </h2>
            <p className="site-section-intro max-w-[45rem] text-white/84">
              {content.socialProof.description}
            </p>
            <SectionCta label={content.ctas.free} inverse />
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] py-14 md:py-20">
          <div className="site-shell-page sogp-shell-page grid gap-9 md:grid-cols-[0.7fr_1.3fr] md:gap-14">
            <h2 className="site-section-heading text-[2.35rem] md:text-[3.4rem]">
              {content.benefits.title}
            </h2>
            <div className="grid content-start gap-6">
              <ul className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
                {content.benefits.items.map((item) => {
                  const [lead, ...rest] = item.split(": ");
                  const detail = rest.join(": ");
                  return (
                    <li key={item} className="py-4 font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.55] text-[var(--color-text-muted)]">
                      <span className="font-semibold text-[var(--color-text-strong)]">
                        {lead}
                        {detail ? ":" : null}
                      </span>
                      {detail ? ` ${detail}` : null}
                    </li>
                  );
                })}
              </ul>
              <SectionCta label={content.ctas.free} />
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-brand-sky)] py-14 md:py-20">
          <div className="site-shell-page sogp-shell-page grid gap-9 md:grid-cols-[0.7fr_1.3fr] md:gap-14">
            <div className="grid content-start gap-3">
              <p className="site-hero-eyebrow text-[var(--color-brand-indigo)]">
                Need to know
              </p>
              <h2 className="site-section-heading text-[2.35rem] text-[var(--color-brand-blue)] md:text-[3.4rem]">
                Frequently asked questions
              </h2>
            </div>
            <div className="grid content-start gap-6">
              <Accordion className="gap-3">
                {content.faqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.question}
                    value={`faq-${index + 1}`}
                    className="rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-sm)]"
                  >
                    <AccordionTrigger className="min-h-14 py-4 font-[var(--font-be-vietnam-pro)] text-[0.96rem] font-semibold leading-[1.4] md:text-[1.03rem]">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="font-[var(--font-be-vietnam-pro)] text-[0.92rem] leading-[1.6] md:text-[0.97rem]">
                      <p>{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <SectionCta label={content.ctas.free} />
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-brand-blue)] py-14 text-white md:py-18">
          <div className="site-shell-page sogp-shell-page grid justify-items-start gap-5 md:justify-items-center md:text-center">
            <h2 className="site-section-heading max-w-[17ch] text-[2.2rem] text-white md:text-[3rem]">
              Find truth. Discover God’s purpose. Grow to fulfil it.
            </h2>
            <SectionCta label={content.ctas.free} inverse />
          </div>
        </section>
      </main>

      <HomepageFooter />
    </PublicSitePageShell>
  );
}
