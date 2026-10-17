"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { dashboardTrailForPath } from "@/lib/dashboard/shell-navigation";

import styles from "./breadcrumbs.module.css";

type Labels = Record<string, string>;
const CrumbLabels = createContext<{ labels: Labels; set: (href: string, label: string | null) => void } | null>(null);

/** Holds the real names pages give their crumbs (a group's name instead of "Group"). */
export function CrumbLabelProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Labels>({});
  // Stable, so a page's CrumbLabel effect runs only when its own label changes.
  const set = useCallback((href: string, label: string | null) => setLabels(current => {
    if ((current[href] ?? null) === label) return current;
    const next = { ...current };
    if (label === null) delete next[href];
    else next[href] = label;
    return next;
  }), []);
  const value = useMemo(() => ({ labels, set }), [labels, set]);
  return <CrumbLabels.Provider value={value}>{children}</CrumbLabels.Provider>;
}

/** Rendered by a page to name a crumb, e.g. its own group's page. Renders nothing. */
export function CrumbLabel({ href, label }: { href: string; label: string }) {
  const context = useContext(CrumbLabels);
  const set = context?.set;
  useEffect(() => {
    set?.(href, label);
    return () => set?.(href, null);
  }, [set, href, label]);
  return null;
}

/**
 * Where a deep screen sits, under the header (NN/g, GOV.UK): one line of
 * ancestor links, never wrapping, each truncated, ending with the current
 * page (user preference). Phones show the nearest two ancestors; from `lg`
 * the full trail.
 */
export function Breadcrumbs({ pathname, title }: { pathname: string; title: string }) {
  const labels = useContext(CrumbLabels)?.labels ?? {};
  const trail = dashboardTrailForPath(pathname).map(crumb => ({ ...crumb, label: labels[crumb.href] ?? crumb.label }));
  if (!trail.length) return null;
  // Phones keep the first ancestor and the nearest one, folding the middle into "…"
  // (user preference: the ends of a long trail stay visible). From lg: all of it.
  const folded = (index: number) => trail.length > 2 && index > 0 && index < trail.length - 1;
  const sep = (phone: boolean, desktop: boolean) => <span className={styles.sep} data-phone={phone || undefined} data-desktop={desktop || undefined} aria-hidden="true">›</span>;
  return <nav aria-label="Breadcrumb" className={styles.trail}>
    <ol>
      {trail.map((crumb, index) => <li key={crumb.href} data-collapsed={folded(index) || undefined}>
        {sep(index > 0 && !folded(index), index > 0)}
        <Link href={crumb.href} title={crumb.label}>{crumb.label}</Link>
        {index === 0 && trail.length > 2 ? <span className={styles.more} aria-hidden="true">{sep(true, false)}…</span> : null}
      </li>)}
      <li className={styles.current} aria-current="page">{sep(true, true)}<span>{labels[pathname] ?? title}</span></li>
    </ol>
  </nav>;
}
