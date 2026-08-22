import type { Metadata } from "next";

import { SogpEnrollmentPage } from "@/components/sogp/sogp-enrollment-page";

export const metadata: Metadata = {
  title: "Enrol in the School of God's Purpose",
  description: "Join the next free four-week SOGP cohort.",
};

export default function SogpEnrollPage() {
  return <SogpEnrollmentPage />;
}
