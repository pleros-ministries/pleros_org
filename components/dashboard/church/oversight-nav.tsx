"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "@/components/community/discipleship/discipleship-group.module.css";

export const OVERSIGHT_HOME = "/dashboard/community/oversight";

const TABS = [
  { href: OVERSIGHT_HOME, label: "Overview" },
  { href: `${OVERSIGHT_HOME}/reports`, label: "Reports" },
  { href: `${OVERSIGHT_HOME}/structure`, label: "Structure" },
] as const;

/**
 * One header for the three Oversight destinations (user request, 18 October):
 * the same title and scope line, then Overview · Reports · Structure, so the
 * reports and structure pages read as parts of Oversight, not separate places.
 */
export function OversightHeader({ sub, counts }: { sub: string; counts?: { reports?: number; structure?: number } }) {
  const pathname = usePathname() ?? OVERSIGHT_HOME;
  return <>
    <div className={styles.heading}><div><h1>Oversight</h1><p className={styles.sub}>{sub}</p></div></div>
    <nav aria-label="Oversight" className="grid grid-cols-3 rounded-[10px] bg-[#eceef2] p-[3px]">
      {TABS.map(tab => {
        const active = tab.href === OVERSIGHT_HOME ? pathname === OVERSIGHT_HOME : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const count = tab.label === "Reports" ? counts?.reports : tab.label === "Structure" ? counts?.structure : undefined;
        return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined}
          className={`inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-[7px] px-1 text-[13px] font-medium no-underline transition-colors ${active ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>
          <span className="truncate">{tab.label}</span>
          {count ? <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#f7e4cd] px-1 text-[11px] font-semibold text-[#92400e]">{count}</span> : null}
        </Link>;
      })}
    </nav>
  </>;
}
