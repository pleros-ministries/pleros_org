import type { Metadata } from "next";

import { SogpLandingPage } from "@/components/sogp/sogp-landing-page";

export const metadata: Metadata = {
  title: "School of God's Purpose",
  description:
    "A free four-week school for truth, spiritual growth, and the fulfilment of God's purpose.",
};

export default function SogpPage() {
  return <SogpLandingPage />;
}
