import { LockIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { homeWhatsappChannelUrl } from "@/lib/site-homepage-content";
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
        <span className="site-button-text mt-1 inline-flex w-fit items-center rounded-full bg-[var(--color-brand-blue)] px-4 py-2 text-[0.68rem] font-semibold leading-none text-white">
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
    <section className="site-font-theme bg-[var(--color-surface)] pb-10">
      <div className="grid gap-10 pb-10">
        <section className="bg-white pt-5 sm:pt-6">
          <div className="container-pleros grid max-w-[36rem] gap-7">
            <div className="grid gap-3">
              <h1 className="site-hero-heading max-w-[15ch] text-[clamp(2.1rem,6vw,2.9rem)] text-[var(--color-brand-blue)]">
                Find the Answer to the Most Important Question of Your Life
              </h1>
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
                Simple, clear, direct, and precise answers to the question
                of purpose and why you exist.
              </p>
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
                You will have zero doubts and guesses after you read this
                book.
              </p>
            </div>

            <div className="relative mx-auto aspect-[253/355] w-full max-w-[13.5rem] overflow-hidden rounded-[0.875rem] shadow-[0_20px_44px_rgba(6,16,86,0.16)]">
              <Image
                src="/site/home/assets/welcome-pack-cards/welcome-book-cover.png"
                alt="Your Pleros Welcome Pack book cover"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] py-8">
          <div className="container-pleros grid max-w-[36rem] gap-3">
            <h2 className="site-section-heading text-[1.55rem] text-[var(--color-brand-blue)]">
              Your Greatest Burden
            </h2>
            <div className="grid gap-2.5 font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-strong)]">
              <p>
                The most troubling concern for all humans is the question
                of purpose.
              </p>
              <p>Why do we exist?</p>
              <p>
                We may have wasted, or might be wasting, our time and life
                right now, if we don&apos;t know exactly why we exist and
                are not living for His purpose.
              </p>
              <p>
                It is not unlikely that you have heard many generic answers
                that seem more like assumptions and guesses.
              </p>
              <p>But what we need is a clear, precise, and direct answer.</p>
            </div>
          </div>
        </section>

        <section className="bg-white py-8">
          <div className="container-pleros grid max-w-[36rem] gap-2.5 font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-strong)]">
            <p>What we are offering is not a solution suggestion or a guess.</p>
            <p>
              What we offer is an exact and objective answer to the
              question of purpose.
            </p>
            <p>
              This book will lift all concerns, melt all doubts, and
              resolve all major questions you have about your purpose and
              pursuit of it.
            </p>
          </div>
        </section>

        <section className="bg-[var(--color-brand-sky)] py-8">
          <div className="container-pleros grid max-w-[36rem] gap-6">
            <div className="grid gap-2.5 font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-strong)]">
              <p>
                The matter discussed and answered in this book is so
                important that we cannot afford to put a price on it.
              </p>
              <p>
                You need the answer now, and we want you to have it
                immediately.
              </p>
              <p className="font-semibold text-[var(--color-brand-blue)]">
                So this book is absolutely FREE.
              </p>
              <p>
                It is a 25&ndash;30 minute read at slow pace. Also available
                in audio format, which is a 45 minute listen.
              </p>
            </div>

            <div className="grid gap-4">
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
            </div>
          </div>
        </section>

        {hasExtraGifts ? (
          <section className="bg-white py-8">
            <div className="container-pleros grid max-w-[36rem] gap-6">
              <div className="grid gap-2.5 font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-strong)]">
                <p>
                  Aside from getting this book for free, we have TWO other
                  special gifts for you.
                </p>
                <p>
                  If you get this book today and recommend it to others,
                  you will access our special gift for you.
                </p>
              </div>

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
            </div>
          </section>
        ) : (
          <section className="bg-white py-8">
            <div className="container-pleros grid max-w-[36rem] gap-2 rounded-[1.25rem] bg-[var(--color-brand-sky)] px-4 py-4">
              <h2 className="site-section-heading text-[1.55rem] text-[var(--color-brand-blue)]">
                More resources are coming
              </h2>
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.86rem] leading-[1.35] tracking-[-0.02em] text-[var(--color-brand-blue)]">
                The supplementary packs are not ready yet. For now, your
                welcome pack book is available above and in your email.
              </p>
            </div>
          </section>
        )}

        <div className="relative px-[1.3125rem] py-[4.5625rem] text-center text-white lg:px-16 lg:py-24">
          <div className="grid gap-[3.8125rem]">
            <div className="grid justify-items-center gap-[0.8125rem]">
              <h2 className="site-section-heading max-w-[33.5625rem] text-white">
                Join Pleros Community Channel
              </h2>
              <p className="site-section-intro max-w-[28.125rem] text-white/90">
                This is a community open to anyone who desires edification via platforms of the Word and prayer designed to help you walk in and fulfill God&apos;s purpose daily.

              </p>
            </div>

            <div className="flex justify-center">
              <Link
                href={homeWhatsappChannelUrl}
                target="_blank"
                rel="noreferrer"
                className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-lime)] px-6 py-2.5 text-[0.875rem] leading-none font-semibold text-[var(--color-brand-blue)]"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
