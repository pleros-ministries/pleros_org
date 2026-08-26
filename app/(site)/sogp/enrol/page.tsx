import type { Metadata } from "next";
import { headers } from "next/headers";

import { SogpEnrollmentPage } from "@/components/sogp/sogp-enrollment-page";
import { resolveSogpCountryCode } from "@/lib/sogp/countries";

export const metadata: Metadata = {
  title: "Enrol in the School of God's Purpose",
  description: "Join the next free four-week SOGP cohort.",
};

export default async function SogpEnrolPage() {
  const requestHeaders = await headers();
  const defaultCountryCode = resolveSogpCountryCode(
    requestHeaders.get("x-vercel-ip-country"),
  );
  return <SogpEnrollmentPage defaultCountryCode={defaultCountryCode} />;
}
