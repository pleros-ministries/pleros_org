import type { Metadata } from "next";

import { DiscipleshipJourneyPage } from "@/components/dashboard/discipleship-journey-page";

export const metadata: Metadata = {
  title: "Discipleship Journey preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DiscipleshipJourneyPreviewPage() {
  return (
    <DiscipleshipJourneyPage previewHrefPrefix="/preview/dashboard/discipleship-journey" />
  );
}
