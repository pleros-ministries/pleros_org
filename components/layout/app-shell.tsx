import Link from "next/link";

import { SiteNav } from "@/components/layout/site-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="pleros-nav">
        <SiteNav />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="pleros-footer">
        <div className="container-pleros flex flex-col gap-2 py-6 text-[var(--text-sm)] text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>(c) {year} Pleros Ministries &amp; Missions</p>
          <div className="flex items-center gap-3">
            <Link href="/#socials" className="hover:text-[var(--color-text-strong)]">
              Socials
            </Link>
            <Link href="/style-demo" className="hover:text-[var(--color-text-strong)]">
              Style demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
