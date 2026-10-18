import type { Metadata } from "next";
import { headers } from "next/headers";

import { SogpEnrollmentPage } from "@/components/sogp/sogp-enrollment-page";
import { getReferrerFirstName } from "@/lib/db/queries/sogp-referrals";
import { resolveSogpCountryCode } from "@/lib/sogp/countries";

export const metadata: Metadata = {
  title: "Enrol in the School of God's Purpose",
  description: "Join the next free four-week SOGP cohort.",
};

export default async function SogpEnrolPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const requestHeaders = await headers();
  const { ref } = await searchParams;
  const referrerFirstName = typeof ref === "string" ? await getReferrerFirstName(ref).catch(() => null) : null;
  const defaultCountryCode = resolveSogpCountryCode(
    requestHeaders.get("x-vercel-ip-country"),
  );
  return <SogpEnrollmentPage defaultCountryCode={defaultCountryCode} referrerFirstName={referrerFirstName} />;
}
