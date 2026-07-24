import Link from "next/link";
import Image from "next/image";

import {
  welcomeDashboardSections,
  type WelcomeDashboardSection,
} from "@/lib/welcome-dashboard-content";
import { cn } from "@/lib/utils";

function getDashboardCardClasses(accent: "orange" | "blue") {
  if (accent === "orange") {
    return "border-transparent bg-[linear-gradient(180deg,#f25d1a_0%,#ee5718_100%)] text-white shadow-[0_14px_30px_rgba(242,93,26,0.18)]";
  }

  return "border-transparent bg-[linear-gradient(180deg,#2f318a_0%,#2b2d7f_100%)] text-white shadow-[0_14px_30px_rgba(43,45,127,0.2)]";
}

function DashboardCard({
  title,
  description,
  href,
  accent,
  backgroundImageSrc,
  backgroundImagePosition,
  backgroundOverlay = "text-gradient",
}: {
  title: string;
  description: string;
  href?: string;
  accent: "orange" | "blue";
  backgroundImageSrc?: string;
  backgroundImagePosition?: string;
  backgroundOverlay?: "text-gradient" | "text-panel" | "none";
}) {
  const className = cn(
    "group relative flex min-h-[14.625rem] flex-col justify-end overflow-hidden rounded-[var(--radius-md)] border p-3 pb-4 shadow-[var(--shadow-sm)] transition-transform duration-150 ease-out sm:min-h-[15.5rem] sm:p-4 sm:pb-5",
    href && "hover:-translate-y-px",
    backgroundImageSrc
      ? "border-transparent bg-transparent text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]"
      : getDashboardCardClasses(accent),
  );

  const content = (
    <>
      {backgroundImageSrc ? (
        <>
          <Image
            src={backgroundImageSrc}
            alt=""
            fill
            className={cn("scale-[1.035] object-cover", backgroundImagePosition)}
            sizes="(max-width: 640px) 50vw, 18rem"
          />
          {backgroundOverlay === "text-gradient" ? (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(0deg,rgba(0,0,0,0.48)_0%,rgba(0,0,0,0.24)_52%,rgba(0,0,0,0)_100%)]"
            />
          ) : null}
          {backgroundOverlay === "text-panel" ? (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(0deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.32)_58%,rgba(0,0,0,0)_100%)]"
            />
          ) : null}
        </>
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.22) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="relative z-10 grid gap-1.5">
        <h2 className="site-pathway-title max-w-[13ch] text-[1rem] text-white">
          {title}
        </h2>
        <p className="font-[var(--font-be-vietnam-pro)] max-w-[18ch] text-[0.6875rem] leading-[1.15] tracking-[-0.01em] text-white/92 sm:text-[0.8125rem]">
          {description}
        </p>
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
      className="relative mt-12 overflow-hidden bg-[linear-gradient(180deg,#f4fcff_0%,#dff5ff_100%)] px-[1.25rem] py-14 text-[var(--color-brand-blue)] sm:mt-14 sm:px-8 sm:py-16"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(244,252,255,0.98)_0%,rgba(244,252,255,0.92)_56%,rgba(223,245,255,0.78)_100%)]"
      />
      <Image
        src="/site/home/assets/pathway-card-headers/church-card-header.svg"
        alt=""
        width={486}
        height={246}
        className="pointer-events-none absolute right-[-5rem] bottom-[-3.5rem] h-auto w-[18rem] max-w-none opacity-[0.18] sm:right-[-2rem] sm:bottom-[-4rem] sm:w-[24rem]"
      />

      <div className="relative mx-auto grid max-w-[36rem] justify-items-start gap-6 sm:gap-7">
        <div className="grid max-w-[28rem] gap-5">
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
              fulfillment of His purpose.
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
        <div className="container-pleros flex min-h-[17.8125rem] max-w-[36rem] flex-col justify-end pb-8 pt-10 text-white sm:min-h-[21rem] sm:pb-10 sm:pt-12">
          <div className="grid max-w-[19rem] gap-3">
            <h1 className="site-hero-heading max-w-[16ch] text-[clamp(2.25rem,7vw,4.1rem)] text-white">
              {name ? `Welcome, ${name}` : "Welcome to your Pleros Dashboard"}
            </h1>
            <p className="font-[var(--font-be-vietnam-pro)] max-w-[28ch] text-[0.9375rem] leading-[1.35] tracking-[-0.02em] text-white/88 sm:text-[1.05rem]">
              Start with the welcome pack and other resources.
            </p>
          </div>
        </div>
      </header>

      <div className="container-pleros grid max-w-[36rem] gap-10 pt-9 pb-12 sm:pt-10 sm:pb-14">
        <div className="grid gap-10">
          {sections.map((section) => (
            <section key={section.id} className="grid gap-4">
              <div className="grid gap-2">
                <h2 className="site-section-heading text-[1.1rem] text-[var(--color-brand-blue)] sm:text-[1.35rem]">
                  {section.title}
                </h2>
                <div className="h-px w-full bg-[rgba(1,21,133,0.3)]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {section.cards.map((card) => (
                  <DashboardCard
                    key={card.id}
                    title={card.title}
                    description={card.description}
                    href={card.href}
                    accent={card.accent}
                    backgroundImageSrc={card.backgroundImageSrc}
                    backgroundImagePosition={card.backgroundImagePosition}
                    backgroundOverlay={card.backgroundOverlay}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <DashboardChurchMinistryStrip />
    </section>
  );
}
