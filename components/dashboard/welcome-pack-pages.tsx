import { ArrowLeftIcon, LockIcon, SendIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getWelcomePackHubCards } from "../../lib/welcome-pack-hub";
import {
  extraGifts,
  mainGifts,
  type WelcomePackGift,
} from "../../lib/welcome-pack-gifts";

const hubPath = "/dashboard/welcomepack";

function HubBackLink() {
  return (
    <Link
      href={hubPath}
      className="inline-flex w-fit items-center gap-1.5 font-[var(--font-be-vietnam-pro)] text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-blue)]"
    >
      <ArrowLeftIcon className="size-4" />
      Welcome Pack
    </Link>
  );
}

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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-[var(--font-be-vietnam-pro)] text-[0.7rem] font-semibold text-[var(--color-brand-blue)]">
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
        <p className="font-[var(--font-be-vietnam-pro)] text-[0.76rem] leading-[1.3] text-[var(--color-text-muted)]">
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

  return locked ? card : <Link href={gift.href}>{card}</Link>;
}

export function WelcomePackHubPage({
  basePath = hubPath,
}: {
  basePath?: string;
}) {
  const cards = getWelcomePackHubCards(basePath);

  return (
    <section className="site-font-theme bg-[var(--color-surface)] py-7 sm:py-10">
      <div className="container-pleros grid max-w-[42rem] gap-7 pb-12">
        <header className="grid gap-2">
          <p className="site-hero-eyebrow text-[var(--color-brand-blue)]">
            Start here
          </p>
          <h1 className="site-hero-heading text-[clamp(2.5rem,7vw,4rem)] text-[var(--color-brand-blue)]">
            Your Welcome Pack
          </h1>
          <p className="site-section-intro max-w-[34rem] text-[var(--color-text-muted)]">
            Begin with your welcome message, continue to orientation, then open
            your gifts.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          {cards.map((card, index) => (
            <Link
              key={card.id}
              href={card.href}
              className={`group relative grid min-h-[13rem] content-end overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] p-4 text-white shadow-[var(--shadow-sm)] transition-transform duration-150 hover:-translate-y-px sm:min-h-[16rem] ${
                index === 0 ? "col-span-2" : ""
              }`}
            >
              <Image
                src={card.imageSrc}
                alt=""
                fill
                sizes={index === 0 ? "42rem" : "21rem"}
                className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,10,70,0.72)_0%,rgba(0,10,70,0.22)_62%,transparent_100%)]"
              />
              <span className="relative z-10 grid gap-1.5">
                <strong className="site-pathway-title text-xl font-semibold leading-none text-white">
                  {card.title}
                </strong>
                <span className="max-w-[28ch] font-[var(--font-be-vietnam-pro)] text-xs leading-[1.4] text-white/88">
                  {card.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WelcomePackJoinPage({
  telegramUrl,
  videoSrc,
}: {
  telegramUrl: string;
  videoSrc: string | null;
}) {
  return (
    <main className="site-font-theme grid min-h-screen place-items-center bg-[var(--color-brand-blue)] px-5 py-10 text-white">
      <section className="grid w-full max-w-[34rem] gap-7">
        <header className="grid gap-3 text-center">
          <p className="site-hero-eyebrow justify-center text-[var(--color-brand-lime)]">
            Welcome to SOGP
          </p>
          <h1 className="site-hero-heading text-[clamp(2.5rem,9vw,4rem)] text-white">
            Your journey starts here
          </h1>
        </header>

        {videoSrc ? (
          <video
            controls
            playsInline
            preload="metadata"
            src={videoSrc}
            className="aspect-video w-full rounded-[var(--radius-md)] bg-black object-cover shadow-[var(--shadow-lg)]"
          />
        ) : (
          <div className="grid aspect-video place-items-center rounded-[var(--radius-md)] border border-white/18 bg-white/8 p-6 text-center">
            <div className="grid gap-2">
              <strong className="font-[var(--font-sen)] text-xl">
                Welcome message video coming soon
              </strong>
              <span className="font-[var(--font-be-vietnam-pro)] text-sm text-white/72">
                The final welcome message will appear here.
              </span>
            </div>
          </div>
        )}

        <div className="grid justify-items-center gap-3 text-center">
          <p className="max-w-[32rem] font-[var(--font-be-vietnam-pro)] text-sm leading-[1.6] text-white/82">
            Join the orientation group for your next steps, preparation, and
            important SOGP updates.
          </p>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="site-button-text inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
          >
            <SendIcon className="size-4" />
            Join the orientation group
          </a>
        </div>
      </section>
    </main>
  );
}

export function WelcomePackOrientationPage({ videoSrc }: { videoSrc: string }) {
  return (
    <section className="site-font-theme bg-[var(--color-surface)] py-7 sm:py-10">
      <div className="container-pleros grid max-w-[42rem] gap-6 pb-12">
        <HubBackLink />
        <header className="grid gap-2">
          <h1 className="site-hero-heading text-[clamp(2.5rem,7vw,4rem)] text-[var(--color-brand-blue)]">
            Orientation video
          </h1>
          <p className="site-section-intro text-[var(--color-text-muted)]">
            Understand the SOGP journey and what comes next.
          </p>
        </header>
        <video
          controls
          playsInline
          preload="metadata"
          src={videoSrc}
          poster="/site/sogp/sogp-welcome-WaXgk9zqi78.jpg"
          className="aspect-video w-full rounded-[var(--radius-md)] bg-black object-cover shadow-[var(--shadow-md)]"
        />
      </div>
    </section>
  );
}

export function WelcomePackGiftsPage({
  extraGiftsUnlocked,
}: {
  extraGiftsUnlocked: boolean;
}) {
  return (
    <section className="site-font-theme bg-[var(--color-surface)] py-7 sm:py-10">
      <div className="container-pleros grid max-w-[36rem] gap-9 pb-12">
        <HubBackLink />
        <header className="grid gap-2">
          <h1 className="site-hero-heading text-[clamp(2.5rem,7vw,4rem)] text-[var(--color-brand-blue)]">
            Your gifts
          </h1>
        </header>

        <section className="grid gap-4">
          <h2 className="site-section-heading text-[1.55rem] text-[var(--color-brand-blue)]">
            Main gifts
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {mainGifts.map((gift) => (
              <GiftCard key={gift.id} gift={gift} locked={gift.locked} />
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div className="grid gap-1">
            <h2 className="site-section-heading text-[1.55rem] text-[var(--color-brand-blue)]">
              Extra gifts
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] text-sm text-[var(--color-text-muted)]">
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
      </div>
    </section>
  );
}
