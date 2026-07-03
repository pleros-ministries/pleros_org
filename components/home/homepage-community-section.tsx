import Image from "next/image";
import Link from "next/link";

import { homeWhatsappChannelUrl } from "../../lib/site-homepage-content";

export function HomepageCommunitySection() {
  return (
    <section id="community" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/site/home/assets/pleros-community-background.png"
          alt=""
          fill
          className="object-cover grayscale"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/62" />
      </div>

      <div className="relative px-[1.3125rem] py-[4.5625rem] text-center text-white lg:px-16 lg:py-24">
        <div className="grid gap-[3.8125rem]">
          <div className="grid justify-items-center gap-[0.8125rem]">
            <h2 className="site-section-heading max-w-[33.5625rem] text-white">
              Join Pleros Community Channel
            </h2>
            <p className="site-section-intro max-w-[28.125rem] text-white/90">
              This is a community open to anyone who desires edification via platforms of the Word and prayer designed to help you walk in and fulfill God's purpose daily.

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
    </section>
  );
}
