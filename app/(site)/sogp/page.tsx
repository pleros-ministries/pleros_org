import type { Metadata } from "next";

import { SogpLandingPage } from "@/components/sogp/sogp-landing-page";
import { getReferrerFirstName } from "@/lib/db/queries/sogp-referrals";

// Cache Components: Reads the request; not adopted yet.
export const instant = false;

export const metadata: Metadata = {
  title: "School of God's Purpose",
  description:
    "Find Truth, Discover God's Purpose and Grow to fulfill it at SOGP.",
};

const FORWARDED_KEYS = [
  "ref",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export default async function SogpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const input = await searchParams;
  const params = new URLSearchParams();
  for (const key of FORWARDED_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value.length <= 200) params.set(key, value);
  }
  const query = params.toString();
  const enrolHref = `/sogp/enrol${query ? `?${query}` : ""}`;

  const ref = params.get("ref");
  const referrerFirstName = ref ? await getReferrerFirstName(ref).catch(() => null) : null;
  return <SogpLandingPage enrolHref={enrolHref} referrerFirstName={referrerFirstName} />;
}
