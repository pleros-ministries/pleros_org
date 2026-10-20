"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { useIdlePrefetch } from "@/lib/dashboard/use-idle-prefetch";

export const OVERSIGHT_HOME = "/dashboard/community/oversight";

const TABS = [
  { href: OVERSIGHT_HOME, label: "Structure" },
  { href: `${OVERSIGHT_HOME}/reports`, label: "Reports" },
  { href: `${OVERSIGHT_HOME}/updates`, label: "Updates" },
] as const;

/**
 * One header for Oversight's three tabs (Pastor, 20 October): Structure (the
 * groups), Reports and Updates (the old "Needs you"). `under` keeps the tabs
 * on the same person's groups when switching.
 */
export function OversightHeader({ sub, updates, under, title = "Oversight" }: { sub: string; updates?: number; under?: string | null; title?: string }) {
  const pathname = usePathname() ?? OVERSIGHT_HOME;
  const query = under ? `?under=${encodeURIComponent(under)}` : "";
  const tabs = TABS.map(tab => ({ ...tab, to: `${tab.href}${query}` }));
  // Every tab loads in the background, so switching between them is instant.
  useIdlePrefetch(tabs.map(tab => tab.to));
  return <>
    <div className={styles.heading}><div><h1>{title}</h1><p className={styles.sub}>{sub}</p></div></div>
    <nav aria-label="Oversight" className="grid grid-cols-3 rounded-[10px] bg-[#eceef2] p-[3px]">
      {tabs.map(tab => {
        const active = tab.href === OVERSIGHT_HOME ? pathname === OVERSIGHT_HOME : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const count = tab.label === "Updates" ? updates : undefined;
        return <Link key={tab.href} href={tab.to} prefetch scroll={false} aria-current={active ? "page" : undefined}
          className={`inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-[7px] px-1 text-[13px] font-medium no-underline transition-colors ${active ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>
          <span className="truncate">{tab.label}</span>
          {count ? <span className="inline-grid box-border h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full leading-none tabular-nums bg-[#f7e4cd] px-1 text-[11px] font-medium text-[#92400e]">{count}</span> : null}
        </Link>;
      })}
    </nav>
  </>;
}
