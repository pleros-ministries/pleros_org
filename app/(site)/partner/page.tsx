import type { Metadata } from "next";

import { PartnerPageView } from "../../../components/home/partner-page-view";

export const metadata: Metadata = {
  title: "Partner with Us | Pleros",
  description:
    "Learn how to partner with Pleros Ministries and Missions to advance the Gospel.",
};

export default function PartnerPage() {
  return <PartnerPageView />;
}
