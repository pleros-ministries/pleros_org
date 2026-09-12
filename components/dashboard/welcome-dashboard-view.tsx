import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

import {
  welcomeDashboardSections,
  type WelcomeDashboardSection,
  type WelcomeDashboardSectionAccent,
} from "@/lib/welcome-dashboard-content";
import { InstallAppCta } from "@/components/pwa/install-app-cta";
import { cn } from "@/lib/utils";

function accentTokens(accent: WelcomeDashboardSectionAccent) {
  switch (accent) {
    case "gold":
      return {
        surface: "bg-(--questions-surface)",
        chip: "bg-white text-(--questions-accent)",
      };
    case "purple":
      return {
        surface: "bg-(--purpose-surface)",
        chip: "bg-white text-(--purpose-accent)",
      };
    case "green":
      return {
        surface: "bg-(--fulfil-surface)",
        chip: "bg-white text-(--fulfil-accent)",
      };
    default:
      return {
        surface: "bg-(--muted)",
        chip: "bg-white text-(--color-brand-blue)",
      };
  }
}

function DashboardCard({
  title,
  description,
  href,
  accent,
  icon: Icon,
  showPlusBadge = false,
  status,
  statusLabel,
}: {
  title: string;
  description: string;
  href?: string;
  accent: WelcomeDashboardSectionAccent;
  icon: LucideIcon;
  showPlusBadge?: boolean;
  status: "available" | "enrolment_required" | "upcoming" | "coming_soon";
  statusLabel?: string;
}) {
  const { surface, chip } = accentTokens(accent);
  const className = cn(
    "group relative flex min-h-[6.75rem] flex-col justify-between gap-2 rounded-(--radius-lg) p-3 shadow-(--shadow-sm) transition-[transform,box-shadow] duration-150 ease-out sm:min-h-[7.75rem] sm:p-3.5",
    surface,
    href && "hover:-translate-y-px hover:shadow-(--shadow-md)",
    status === "coming_soon" && "cursor-default saturate-[0.72]",
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "relative inline-flex size-9 items-center justify-center rounded-full shadow-(--shadow-sm)",
            chip,
          )}
        >
          <Icon className="size-4.5" strokeWidth={2} />
          {showPlusBadge ? (
            <span className="absolute -right-1 -bottom-1 inline-flex size-3.5 items-center justify-center rounded-full bg-(--color-brand-blue) text-white ring-2 ring-white">
              <PlusIcon className="size-2" strokeWidth={3} />
            </span>
          ) : null}
        </span>
        {statusLabel ? (
          <span className="inline-flex h-fit w-fit items-center rounded-full bg-white/85 px-2.5 py-1 font-[var(--font-be-vietnam-pro)] text-[0.6rem] font-semibold text-(--color-brand-blue) shadow-(--shadow-sm)">
            {statusLabel}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="grid min-w-0 gap-1">
          <h2 className="site-dashboard-card-title max-w-[16ch] text-[0.9rem] text-(--color-text-strong) sm:text-[1.05rem]">
            {title}
          </h2>
          <p className="site-dashboard-card-body max-w-[22ch] text-[0.7125rem] text-(--color-text-muted)">
            {description}
          </p>
        </div>
        {href ? (
          <ChevronRightIcon
            className="size-4 shrink-0 text-(--color-text-muted) transition-transform duration-150 group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        ) : null}
      </div>
    </>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function DashboardChurchMinistryStrip() {
  return (
    <section
      aria-labelledby="dashboard-church-ministry-title"
      className="relative mt-8 overflow-hidden bg-[linear-gradient(180deg,#f4fcff_0%,#dff5ff_100%)] px-[1.25rem] py-10 text-[var(--color-brand-blue)] sm:mt-10 sm:px-8 sm:py-12"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(244,252,255,0.98)_0%,rgba(244,252,255,0.92)_56%,rgba(223,245,255,0.78)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-5rem] bottom-[-3.5rem] h-[9rem] w-[18rem] bg-[linear-gradient(135deg,rgba(5,20,128,0.2)_0%,rgba(5,20,128,0.12)_58%,rgba(5,20,128,0.06)_100%)] sm:right-[-2rem] sm:bottom-[-4rem] sm:h-[12.125rem] sm:w-[24rem] md:right-[-3rem] md:bottom-[-7.5rem] md:h-[13.125rem] md:w-[26rem]"
        style={{
          WebkitMaskImage:
            "url('/site/home/assets/pathway-card-headers/church-card-header.svg')",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskImage:
            "url('/site/home/assets/pathway-card-headers/church-card-header.svg')",
          maskPosition: "center",
          maskRepeat: "no-repeat",
          maskSize: "contain",
        }}
      />

      <div className="relative mx-auto grid max-w-[36rem] justify-items-start gap-6 sm:gap-7">
        <div className="grid max-w-[28rem] gap-3">
          <p className="font-[var(--font-be-vietnam-pro)] text-[0.6875rem] font-semibold tracking-[0.22em] text-[var(--color-brand-blue)] uppercase">
            Our church ministry
          </p>
          <div className="grid gap-3">
            <h2
              id="dashboard-church-ministry-title"
              className="site-section-heading text-[1.75rem] text-[var(--color-text-strong)] sm:text-[2.25rem]"
            >
              Fellowship with Fullness of Christ Church
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] max-w-[28rem] text-[0.9375rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-strong)] sm:text-[1.05rem]">
              Grow with believers committed to God&apos;s Word, prayer, and the
              fulfilment of His purpose.
            </p>
          </div>
        </div>

        <Link
          href="/fcc"
          className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-lime)] px-7 py-2.5 text-[0.875rem] leading-none font-semibold text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
        >
          Learn more
        </Link>
      </div>
    </section>
  );
}

type WelcomeDashboardViewProps = {
  name?: string;
  sections?: WelcomeDashboardSection[];
};

export function WelcomeDashboardView({
  name,
  sections = welcomeDashboardSections,
}: WelcomeDashboardViewProps = {}) {
  return (
    <section className="site-font-theme bg-[var(--color-surface)]">
      <header className="relative overflow-hidden bg-[var(--color-brand-blue)]">
        <div className="container-pleros flex min-h-[4rem] max-w-[36rem] flex-col justify-end pb-5 pt-7 text-white sm:min-h-[15rem] sm:pb-8 sm:pt-10">
          <div className="grid max-w-[19rem] gap-3">
            <h1 className="site-hero-heading max-w-[16ch] text-[clamp(1.875rem,6vw,3.725rem)] text-white">
              {name ? `Welcome, ${name}` : "Welcome to your Pleros Dashboard"}
            </h1>
            {/* <p className="font-[var(--font-be-vietnam-pro)] max-w-[28ch] text-[0.8375rem] leading-[1.35] tracking-[-0.02em] text-white/88 sm:text-[1.05rem]">
              Start with SOGP and keep the resources for your spiritual growth, your walk, and the fulfilment of God&apos;s purpose close.
            </p> */}
          </div>
        </div>
      </header>

      <div className="container-pleros grid max-w-[36rem] gap-7 pt-7 pb-10 sm:pt-8 sm:pb-12">
        <div className="grid gap-6">
          {sections.map((section) => (
            <section key={section.id} className="grid gap-3">
              <div className="grid gap-1">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-(--color-brand-blue)">
                  {section.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {section.cards.map((card) => (
                  <DashboardCard
                    key={card.id}
                    title={card.title}
                    description={card.description}
                    href={card.href}
                    accent={section.accent}
                    icon={card.icon}
                    showPlusBadge={card.id === "advanced-sogp"}
                    status={card.status}
                    statusLabel={card.statusLabel}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <InstallAppCta />
      </div>

      <DashboardChurchMinistryStrip />
    </section>
  );
}
