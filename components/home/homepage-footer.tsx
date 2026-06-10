import Image from "next/image";
import Link from "next/link";

import { footerSocialLinks, homeNavLinks } from "../../lib/site-homepage-content";

export function HomepageFooter() {
  const footerLinks = homeNavLinks.filter((link) => link.href !== "/");

  return (
    <footer className="site-font-theme bg-[var(--color-brand-blue)] text-white">
      <div className="site-shell-bar-inner pb-[2.1875rem] pt-[1.1875rem] lg:pb-8 lg:pt-8">
        <div className="grid gap-[2.6875rem] lg:grid-cols-[minmax(7.5rem,9rem)_minmax(0,1fr)_auto] lg:items-start lg:gap-x-10 lg:gap-y-0 xl:gap-x-14">
          <Image
            src="/site/home/assets/footer--wordmark.png"
            alt="Pleros"
            width={144}
            height={66}
            className="h-[3.9rem] w-auto lg:h-[3.1rem]"
          />

          <div className="grid gap-[0.5625rem] lg:gap-2">
            <p className="site-footer-heading">Links</p>
            <nav className="grid gap-[0.125rem] lg:grid-cols-2 lg:gap-x-10 lg:gap-y-0.5 xl:grid-cols-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="site-footer-link"
                >
                  {link.desktopLabel ?? link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="grid gap-3 lg:gap-2">
            <p className="site-footer-heading">Follow</p>
            <div className="flex items-center gap-[0.875rem]">
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
                    width={27}
                    height={27}
                    className="h-[1.68rem] w-[1.68rem] lg:h-6 lg:w-6"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-[2.6875rem] border-t border-white/28 pt-4 lg:mt-8">
          <p className="site-footer-copy">
            © 2026 Pleros Ministries &amp; Missions. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
