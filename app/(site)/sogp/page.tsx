import type { Metadata } from "next";

import { SogpLandingPage } from "@/components/sogp/sogp-landing-page";

export const metadata: Metadata = {
  title: "School of God's Purpose",
  description:
    "Find Truth, Discover God's Purpose and Grow to fulfill it at SOGP.",
};

export default function SogpPage() {
  return <SogpLandingPage />;
}
