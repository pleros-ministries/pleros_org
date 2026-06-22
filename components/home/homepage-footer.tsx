import Image from "next/image";
import Link from "next/link";

import type { HomeNavGroup, HomeNavLink } from "../../lib/site-homepage-content";
import {
  footerSocialLinks,
  homeFooterNavGroups,
} from "../../lib/site-homepage-content";

function FooterNavGroup({
  label,
  links,
}: HomeNavGroup | { label: string; links: readonly HomeNavLink[] }) {
  return (
    <div className="grid content-start gap-1.5 self-start">
      <p className="site-footer-heading">{label}</p>
      <nav className="grid gap-0.5">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="site-footer-link">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function HomepageFooter() {
  return (
    <footer className="site-font-theme bg-[var(--color-brand-blue)] text-white">
      <div className="site-shell-bar-inner pb-8 pt-6 lg:pb-8 lg:pt-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(7.5rem,9rem)_minmax(0,1fr)_auto] xl:items-start xl:gap-x-12 xl:gap-y-0">
          <Image
            src="/site/home/assets/footer--wordmark.png"
            alt="Pleros"
            width={144}
            height={66}
            className="h-[2.75rem] w-auto sm:h-[3.1rem]"
          />

          <div className="grid grid-cols-1 items-start gap-y-6 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-7 xl:grid-cols-3 xl:gap-x-8">
            {homeFooterNavGroups.map((group) => (
              <FooterNavGroup key={group.label} {...group} />
            ))}
          </div>

          <div className="grid content-start gap-2 self-start">
            <p className="site-footer-heading">Follow</p>
            <div className="flex items-center gap-2.5">
              {footerSocialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className="inline-flex items-center justify-center transition-opacity duration-150 hover:opacity-80"
                >
                  <Image
                    src={link.iconSrc}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/28 pt-4">
          <p className="site-footer-copy">
            © 2026 Pleros Ministries &amp; Missions. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
