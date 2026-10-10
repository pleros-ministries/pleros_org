import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

import {
  welcomeDashboardSections,
  type WelcomeDashboardSection,
  type WelcomeDashboardSectionAccent,
} from "@/lib/welcome-dashboard-content";
import { lagosGreeting, sentenceCase } from "@/lib/dashboard/greeting";
import { HomepageFooter } from "@/components/home/homepage-footer";
import { InstallAppCta } from "@/components/pwa/install-app-cta";
import { cn } from "@/lib/utils";

import { focusRing, primaryButton } from "./shell/styles";

function accentTokens(accent: WelcomeDashboardSectionAccent) {
  switch (accent) {
    case "gold":
      return { surface: "bg-(--questions-surface)", chip: "bg-white text-(--questions-accent)" };
    case "purple":
      return { surface: "bg-(--purpose-surface)", chip: "bg-white text-(--purpose-accent)" };
    case "green":
      return { surface: "bg-(--fulfil-surface)", chip: "bg-white text-(--fulfil-accent)" };
    default:
      return { surface: "bg-(--muted)", chip: "bg-white text-(--color-brand-blue)" };
  }
}

function DashboardCard({
  title,
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
    "group flex min-h-[7.25rem] flex-col justify-between gap-3 rounded-lg border border-(--color-line) p-3 transition-colors",
    surface,
    href && "hover:border-(--color-brand-blue)",
    href && focusRing,
    status === "coming_soon" && "cursor-default saturate-[0.72]",
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("relative grid size-8 place-items-center rounded-md", chip)}>
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
          {showPlusBadge ? (
            <span className="absolute -bottom-1 -right-1 grid size-3.5 place-items-center rounded-full bg-(--color-brand-blue) text-white ring-2 ring-white">
              <PlusIcon className="size-2" strokeWidth={3} aria-hidden />
            </span>
          ) : null}
        </span>
        {statusLabel ? (
          <span className="rounded-md bg-white/85 px-1.5 py-0.5 text-[10.5px] font-medium leading-4 text-(--color-brand-blue)">
            {statusLabel}
          </span>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="grid min-w-0 gap-0.5">
          <h3 className="text-[14px] font-medium leading-snug tracking-[-0.01em] text-(--color-text-strong)">
            {title}
          </h3>
        </div>
        {href ? (
          <ChevronRightIcon
            className="size-4 shrink-0 text-(--color-text-muted) transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-(--color-brand-blue)"
            strokeWidth={1.75}
            aria-hidden
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

function DashboardChurchMinistryStrip({ resolveHref }: { resolveHref: (href: string) => string }) {
  return (
    <section
      data-dashboard-public
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
          href={resolveHref("/fcc")}
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
  /** Lagos-time greeting; worked out here when the caller passes none. */
  greeting?: string;
  /** The next Prayer Watch session by the Lagos schedule. */
  prayerWatch?: { label: string; time: string; today: boolean };
  sections?: WelcomeDashboardSection[];
  resolveHref?: (href: string) => string;
  showInstallCta?: boolean;
  className?: string;
};

export function WelcomeDashboardView({
  name,
  greeting,
  prayerWatch,
  sections = welcomeDashboardSections,
  resolveHref = (href) => href,
  showInstallCta = true,
  className,
}: WelcomeDashboardViewProps = {}) {
  const now = new Date();
  const hello = greeting ?? lagosGreeting(now);

  return (
    <>
    <div className={cn("site-font-theme mx-auto grid w-full max-w-[1120px] gap-6 px-4 pb-12 pt-5 font-[family-name:var(--font-be-vietnam-pro)] sm:px-6 sm:pt-7 lg:px-10 lg:pt-9", className)}>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="grid gap-1.5">
          <h1 data-dashboard-greeting className="text-[21px] font-medium leading-tight tracking-[-0.02em] text-(--color-text-strong)">
            {name ? `${hello}, ${name}` : hello}
          </h1>
        </div>
        {prayerWatch ? (
          <Link href={resolveHref("/dashboard/prayer-watch")} className={primaryButton}>
            Prayer Watch · {prayerWatch.today ? "" : "tomorrow "}
            {prayerWatch.time}
          </Link>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-5">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`dashboard-${section.id}`} className="grid content-start gap-2.5">
            <h2
              id={`dashboard-${section.id}`}
              className="text-[13px] font-medium tracking-[-0.01em] text-(--color-text-strong)"
            >
              {sentenceCase(section.title)}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {section.cards.map((card) => (
                <DashboardCard
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  href={card.href ? resolveHref(card.href) : undefined}
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

      {showInstallCta ? <InstallAppCta /> : null}


    </div>
    <DashboardChurchMinistryStrip resolveHref={resolveHref} />
    <HomepageFooter />
    </>
  );
}
