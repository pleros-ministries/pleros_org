import Link from "next/link";
import Image from "next/image";

import { welcomeDashboardSections } from "@/lib/welcome-dashboard-content";
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
        <h2 className="site-pathway-title max-w-[13ch] text-[1.05rem] text-white sm:text-[1.4rem]">
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

type WelcomeDashboardViewProps = {
  name?: string;
};

export function WelcomeDashboardView({ name }: WelcomeDashboardViewProps = {}) {
  return (
    <section className="site-font-theme bg-[var(--color-surface)] pb-24">
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

      <div className="container-pleros grid max-w-[36rem] gap-10 pt-9 sm:pt-10">
        <div className="grid gap-10">
          {welcomeDashboardSections.map((section) => (
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
    </section>
  );
}
