import Link from "next/link";

import { PartnerHome } from "@/components/dashboard/library/partner-home";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import type { PartnerGift } from "@/lib/partner-gifts";

export const metadata = { title: "Partner preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

const SAMPLE: PartnerGift[] = [
  { id: 1, amountMinor: 1_000_000, currency: "NGN", channel: "bank", givenOn: "2026-11-02", note: "Thanksgiving" },
  { id: 2, amountMinor: 5_000, currency: "USD", channel: "online", givenOn: "2026-10-14", note: null },
  { id: 3, amountMinor: 250_000, currency: "NGN", channel: "cash", givenOn: "2026-09-28", note: null },
];

/** The Partner tab with Why partner and Your gifts on sample data. Nothing saves. */
export default async function PartnerPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const empty = (await searchParams).screen === "empty";
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-white [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <p className="m-0 px-4 py-2 text-xs text-(--color-text-muted)">
      Preview · sample data · nothing saved · <Link className="underline" href={empty ? "?" : "?screen=empty"}>{empty ? "With gifts" : "No gifts yet"}</Link>
    </p>
    <PartnerHome name="Sample Giver" email="giver@example.com" gifts={empty ? [] : SAMPLE} preview />
  </div>;
}
