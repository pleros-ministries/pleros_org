import { GiftIcon, LockIcon, PlayCircleIcon, SendIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { HomepageCommunitySection } from "@/components/home/homepage-community-section";
import { extraGifts, mainGifts, type WelcomePackGift } from "@/lib/welcome-pack-gifts";

function GiftCard({
  gift,
  locked = false,
}: {
  gift: WelcomePackGift;
  locked?: boolean;
}) {
  const card = (
    <article className="group overflow-hidden rounded-[0.6875rem] bg-white shadow-[0_12px_26px_rgba(15,23,40,0.08)] ring-1 ring-[rgba(6,16,86,0.08)] transition-transform duration-150 hover:-translate-y-px">
      <div
        className="relative overflow-hidden rounded-t-[0.6875rem]"
        style={
          gift.imageBackgroundColor
            ? { backgroundColor: gift.imageBackgroundColor }
            : undefined
        }
      >
        <Image
          src={gift.imageSrc}
          alt={gift.title}
          width={253}
          height={355}
          className={`h-auto w-full ${locked ? "opacity-55 saturate-[0.65]" : ""}`}
          priority={gift.id === mainGifts[0]?.id}
        />
        {locked ? (
          <div className="absolute inset-0 grid place-items-center bg-[rgba(6,16,86,0.16)]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-[var(--font-be-vietnam-pro)] text-[0.7rem] font-semibold tracking-[-0.01em] text-[var(--color-brand-blue)]">
              <LockIcon className="size-3.5" />
              Coming soon
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 px-3 pb-4 pt-3">
        <h3 className="site-pathway-title text-[1.05rem] text-[var(--color-brand-blue)]">
          {gift.title}
        </h3>
        <p className="font-[var(--font-be-vietnam-pro)] text-[0.76rem] leading-[1.25] tracking-[-0.02em] text-[var(--color-text-muted)]">
          {gift.description}
        </p>
        <span
          className={`site-button-text mt-1 inline-flex w-fit items-center rounded-full px-4 py-2 text-[0.68rem] font-semibold leading-none ${
            locked
              ? "bg-[rgba(6,16,86,0.1)] text-[rgba(6,16,86,0.58)]"
              : "bg-[var(--color-brand-blue)] text-white"
          }`}
        >
          {locked ? "Coming soon" : gift.buttonLabel}
        </span>
      </div>
    </article>
  );

  if (locked) {
    return card;
  }

  return (
    <Link href={gift.href} className="block">
      {card}
    </Link>
  );
}

type WelcomePackPageProps = {
  extraGiftsUnlocked: boolean;
};

export function WelcomePackPage({ extraGiftsUnlocked }: WelcomePackPageProps) {
  const hasExtraGifts = extraGifts.length > 0;

  return (
    <section className="site-font-theme bg-[var(--color-surface)] pt-5 sm:pt-6">
      <div className="container-pleros grid max-w-[36rem] gap-10 pb-10 sm:pb-12">
        <div className="grid gap-2">
          <h1 className="site-hero-heading text-[clamp(2.4rem,6.2vw,3.45rem)] text-[var(--color-brand-blue)]">
            Access your Welcome Pack here
          </h1>
        </div>

        <section id="welcome-orientation" className="scroll-mt-24 grid gap-5">
          <div className="overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] shadow-[var(--shadow-md)]">
            <video
              controls
              playsInline
              preload="metadata"
              poster="/site/sogp/sogp-welcome-WaXgk9zqi78.jpg"
              className="aspect-video w-full bg-black object-cover"
            >
              <source
                src="/site/sogp/sogp-welcome-WaXgk9zqi78.mp4"
                type="video/mp4"
              />
            </video>
          </div>
          <div className="grid gap-3">
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.9rem] leading-[1.5] text-[var(--color-text-muted)]">
              Begin with this welcome, then join the orientation group for your
              next steps, updates, and preparation.
            </p>
            <a
              href="https://t.me/pleros_sogp"
              target="_blank"
              rel="noreferrer"
              className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-6 py-2.5 text-[0.75rem] font-semibold leading-none text-white transition-transform duration-150 hover:-translate-y-px"
            >
              <SendIcon className="size-4" />
              Join the orientation group
            </a>
          </div>
        </section>

        <nav aria-label="Welcome Pack sections" className="grid grid-cols-2 gap-4">
          <a
            href="#welcome-orientation"
            className="group relative grid min-h-36 content-end overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] p-4 text-white"
          >
            <Image
              src="/site/sogp/sogp-welcome-WaXgk9zqi78.jpg"
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 18rem"
              className="object-cover opacity-55 transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <span className="relative z-10 inline-flex items-center gap-2 font-[var(--font-sen)] text-base font-semibold">
              <PlayCircleIcon className="size-4" /> Orientation video
            </span>
          </a>
          <a
            href="#welcome-gifts"
            className="group relative grid min-h-36 content-end overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-brand-sky)] p-4 text-[var(--color-brand-blue)]"
          >
            <Image
              src="/assets/dashboard/welcome-pack-main-gift/ebook-purpose-welcome-card.png"
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 18rem"
              className="object-cover opacity-35 transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <span className="relative z-10 inline-flex items-center gap-2 font-[var(--font-sen)] text-base font-semibold">
              <GiftIcon className="size-4" /> Your gifts
            </span>
          </a>
        </nav>

        <section id="welcome-gifts" className="scroll-mt-24 grid gap-4">
          <div className="grid gap-1">
            <h2 className="site-section-heading text-[1.55rem] text-[var(--color-brand-blue)]">
              Main gifts
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.86rem] leading-[1.35] tracking-[-0.02em] text-[var(--color-text-muted)]">
              Accessible immediately from your welcome pack.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {mainGifts.map((gift) => (
              <GiftCard key={gift.id} gift={gift} locked={gift.locked} />
            ))}
          </div>
        </section>

        {hasExtraGifts ? (
          <section className="grid gap-4">
            <div className="grid gap-1">
              <h2 className="site-section-heading text-[1.55rem] text-[var(--color-brand-blue)]">
                Extra gifts
              </h2>
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.86rem] leading-[1.35] tracking-[-0.02em] text-[var(--color-text-muted)]">
                {extraGiftsUnlocked
                  ? "Your extra gifts are unlocked."
                  : "Supplementary resources are being prepared."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {extraGifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  locked={!extraGiftsUnlocked}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="grid gap-2 rounded-[1.25rem] bg-[var(--color-brand-sky)] px-4 py-4">
            <h2 className="site-section-heading text-[1.55rem] text-[var(--color-brand-blue)]">
              More resources are coming
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.86rem] leading-[1.35] tracking-[-0.02em] text-[var(--color-brand-blue)]">
              The supplementary packs are not ready yet. For now, your welcome
              pack book is available above and in your email.
            </p>
          </section>
        )}

        <section className="grid gap-3 rounded-[0.875rem] bg-white px-4 py-5 shadow-[0_12px_26px_rgba(15,23,40,0.07)] ring-1 ring-[rgba(6,16,86,0.08)]">
          <div className="grid gap-1.5">
            <p className="site-hero-eyebrow text-[0.68rem] text-[var(--color-brand-blue)]">
              Your next step
            </p>
            <h2 className="site-section-heading text-[1.55rem] text-[var(--color-brand-blue)]">
              Go to your dashboard
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.9rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
              Your dashboard brings the full Pleros experience together:
              teachings, devotion, and accountability.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-6 py-2.5 text-[0.75rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.2)] transition-transform duration-150 hover:-translate-y-px hover:text-white focus-visible:text-white"
          >
            Go to dashboard
          </Link>
        </section>
      </div>

      <HomepageCommunitySection />
    </section>
  );
}
