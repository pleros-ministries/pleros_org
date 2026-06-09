import { LockIcon, Share2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { confirmWelcomePackShareAction } from "@/app/_actions/welcome-pack-actions";
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
      <div className="relative overflow-hidden rounded-t-[0.6875rem]">
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
              Locked until you share
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
        <span className="site-button-text mt-1 inline-flex w-fit items-center rounded-full bg-[var(--color-brand-blue)] px-4 py-2 text-[0.68rem] font-semibold leading-none text-white">
          {locked ? "Locked" : gift.buttonLabel}
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
  return (
    <section className="site-font-theme bg-[var(--color-surface)] pb-10 pt-5 sm:pb-12 sm:pt-6">
      <div className="container-pleros grid max-w-[36rem] gap-10">
        <div className="grid gap-2">
          <h1 className="site-hero-heading max-w-[11ch] text-[clamp(2.4rem,6.2vw,3.45rem)] text-[var(--color-brand-blue)]">
            Access your Welcome Pack here
          </h1>
          <p className="font-[var(--font-be-vietnam-pro)] max-w-[31ch] text-[0.95rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
            Your main gifts are ready now. Share the free gift to unlock the two
            extra resources.
          </p>
        </div>

        <section className="grid gap-4">
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
              <GiftCard key={gift.id} gift={gift} />
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div className="grid gap-1">
            <h2 className="site-section-heading text-[1.55rem] text-[var(--color-brand-blue)]">
              Extra gifts
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.86rem] leading-[1.35] tracking-[-0.02em] text-[var(--color-text-muted)]">
              {extraGiftsUnlocked
                ? "Your extra gifts are unlocked."
                : "Locked until you share the free gift with someone."}
            </p>
          </div>

          {!extraGiftsUnlocked ? (
            <form
              action={confirmWelcomePackShareAction}
              className="rounded-[1.25rem] bg-[var(--color-brand-sky)] px-4 py-4"
            >
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.86rem] leading-[1.35] tracking-[-0.02em] text-[var(--color-brand-blue)]">
                Already shared from the thank-you page? Confirm here to unlock
                the two extra gifts.
              </p>
              <button
                type="submit"
                className="site-button-text mt-4 inline-flex min-h-[2.75rem] items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-6 py-2 text-[0.8125rem] font-semibold leading-none text-white"
              >
                <Share2Icon className="size-4" />
                I&apos;ve shared
              </button>
            </form>
          ) : null}

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
