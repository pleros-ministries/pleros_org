import Link from "next/link";

import { PRAYER_WATCH_YOUTUBE_URL } from "../../lib/prayer-watch";

export function HomepagePrayerWatchSection() {
  return (
    <section
      id="prayer-watch"
      className="bg-[var(--color-brand-blue)] px-[1.3125rem] py-[4.5625rem] text-center text-white lg:px-16 lg:py-24"
    >
      <div className="grid gap-[3.8125rem]">
        <div className="grid justify-items-center gap-[0.8125rem]">
          <h2 className="site-section-heading max-w-[33.5625rem] text-white">
            Maintain Devotional and Prayer Consistency.
          </h2>
          <p className="site-section-intro max-w-[28.125rem] text-white/90">
            Join every Pleros Prayer Watch session on YouTube.
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href={PRAYER_WATCH_YOUTUBE_URL}
            target="_blank"
            rel="noreferrer"
            className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-lime)] px-6 py-2.5 text-[0.875rem] leading-none font-semibold text-[var(--color-brand-blue)]"
          >
            Subscribe now
          </Link>
        </div>
      </div>
    </section>
  );
}
