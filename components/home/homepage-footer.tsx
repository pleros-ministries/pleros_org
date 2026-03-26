import Image from "next/image";
import Link from "next/link";

import { footerSocialLinks, homeNavLinks } from "../../lib/site-homepage-content";

export function HomepageFooter() {
  const footerLinks = homeNavLinks.filter((link) => link.href !== "/");

  return (
    <footer className="bg-[var(--color-brand-blue)] px-[1.4375rem] pb-[2.1875rem] pt-[1.1875rem] text-white">
      <div className="grid gap-[2.6875rem]">
        <Image
          src="/site/home/assets/footer--wordmark.png"
          alt="Pleros"
          width={144}
          height={66}
          className="h-[3.9rem] w-auto"
        />

        <div className="grid gap-[0.5625rem]">
          <p className="font-[var(--font-sen)] text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[#ECF9FF]">
            Links
          </p>
          <nav className="grid gap-[0.125rem]">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--text-nav)] leading-[1.85] tracking-[-0.02em] text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid gap-4">
          <p className="font-[var(--font-sen)] text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[#ECF9FF]">
            Follow
          </p>
          <div className="flex items-center gap-[0.875rem]">
            {footerSocialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="inline-flex items-center justify-center"
              >
                <Image
                  src={link.iconSrc}
                  alt=""
                  width={27}
                  height={27}
                  className="h-[1.68rem] w-[1.68rem]"
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/28 pt-4">
          <p className="text-[var(--text-body)] tracking-[-0.02em] text-white">
            © 2026 Pleros Ministries &amp; Missions. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
