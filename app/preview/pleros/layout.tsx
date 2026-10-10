import { Suspense, type CSSProperties } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { DemoProvider } from "@/components/preview/pleros/demo-context";
import { DemoShell } from "@/components/preview/pleros/shell";
import { DemoLoading } from "@/components/preview/pleros/demo-loading";
import styles from "@/components/preview/pleros/demo.module.css";
import { timeOfDayGreeting } from "@/lib/preview/pleros/greeting";
import { lagosToday } from "@/lib/sogp/daily-date";

export const metadata: Metadata = {
  title: "Pleros dashboard demo",
  robots: { index: false, follow: false },
};

/**
 * The authenticated-dashboard prototype. It reads no session and no database:
 * every view runs on synthetic fixtures held in the visitor's browser tab.
 * Brand tokens come from the public theme; type uses the public Be Vietnam Pro body face.
 */
const productType = {
  // Shared primitives reference these legacy font variables directly.
  "--font-suisse-intl": "var(--font-be-vietnam-pro)",
  "--font-sen": "var(--font-be-vietnam-pro)",
  "--font-sans": "var(--font-be-vietnam-pro), ui-sans-serif, system-ui, sans-serif",
  "--font-heading": "var(--font-sans)",
  "--font-display": "var(--font-sans)",
} as CSSProperties;

export default async function PlerosDemoLayout({ children }: { children: React.ReactNode }) {
  // The demo is built around the Lagos day of the request, never the build.
  await connection();
  const today = lagosToday();

  return (
    <div className={`site-font-theme ${styles.fields}`} style={productType}>
      <div className="font-sans text-(--color-text)">
        <Suspense fallback={<DemoLoading />}>
          <DemoProvider today={today} initialGreeting={timeOfDayGreeting(new Date())}>
            <DemoShell>{children}</DemoShell>
          </DemoProvider>
        </Suspense>
      </div>
    </div>
  );
}
