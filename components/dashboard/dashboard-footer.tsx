import Image from "next/image";
import Link from "next/link";

import { GetAppButton } from "@/components/pwa/get-app-button";
import { homeDesktopNavGroups } from "@/lib/site-homepage-content";

/**
 * The dashboard's own footer (Pastor, 20 October): the Pleros wordmark back to
 * the website, the About links, and "Download Pleros" always to hand. The full
 * site footer stays on the public pages.
 */
export function DashboardFooter() {
  const about = homeDesktopNavGroups.find(group => group.label === "About");
  return <footer className="site-font-theme mt-8 bg-[var(--color-brand-blue)] text-white">
    <div className="site-shell-bar-inner grid gap-6 pt-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" aria-label="Pleros website" className="inline-flex transition-opacity hover:opacity-85">
          <Image src="/site/home/assets/footer--wordmark.webp" alt="Pleros" width={144} height={66} className="h-[2.4rem] w-auto" />
        </Link>
        <GetAppButton tone="dark" />
      </div>
      {about ? <div className="grid gap-1.5">
        <p className="site-footer-heading">{about.label}</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-1">
          {about.links.map(link => <Link key={link.href} href={link.href} className="site-footer-link">{link.label}</Link>)}
        </nav>
      </div> : null}
      <p className="site-footer-copy border-t border-white/28 pt-4">© 2026 Pleros Ministries &amp; Missions. All rights reserved</p>
    </div>
  </footer>;
}
