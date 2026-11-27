import type { ReactNode } from "react";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";

import { DemoShell } from "./demo-shell";

export const metadata = { title: "Pleros demo", robots: { index: false, follow: false } };

/** /demo: the newcomer's guided tour on sample data, no account needed. Nothing saves. */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <DemoShell>{children}</DemoShell>
  </div>;
}
