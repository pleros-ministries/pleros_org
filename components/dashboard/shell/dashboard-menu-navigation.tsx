"use client";
import Link from "next/link";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import type { DashboardNavSection } from "@/lib/dashboard/navigation";
import { dashboardAreaHref,dashboardWorkspace } from "@/lib/dashboard/shell-navigation";
import type { DashboardArea } from "@/lib/dashboard/swipe-tabs";
import v3 from "@/components/dashboard/v3/dashboard.module.css";
import frame from "./dashboard-shell.module.css";

/** The approved default menu, not a rendering of the retained route inventory. */
export function DashboardMenuNavigation({ sections,area,onArea,onNavigate }: {
  sections: DashboardNavSection[];area: DashboardArea;
  onArea: (next: DashboardArea,animated?: boolean) => void;onNavigate?: () => void;
}) {
  const community = dashboardAreaHref("community",sections);
  return <>
    <nav aria-label="Dashboard areas" className={v3.drawerRoots}>
      {(["you","community"] as const).map(next => {
        const href = next === "you" ? "/dashboard" : community;
        const contents = <><DashboardIcon name={next === "you" ? "grid" : "people"} />{next === "you" ? "You" : "Community"}</>;
        if (!href) return <span key={next} className={frame.unavailableArea} aria-disabled="true">{contents}</span>;
        return <Link key={next} href={href} aria-current={area === next ? "page" : undefined} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          if (area === next) { onNavigate?.();return; }
          event.preventDefault();onArea(next,event.detail !== 0);onNavigate?.();
        }}>{contents}</Link>;
      })}
    </nav>
    <nav aria-label="Your workspace" className={v3.workspace}><p>Your workspace</p>
      {dashboardWorkspace(sections).map(item => <Link key={item.key} href={item.href} onClick={onNavigate}><DashboardIcon name={item.icon} /><span>{item.label}</span><DashboardIcon name="right" size={16} /></Link>)}
    </nav>
  </>;
}
