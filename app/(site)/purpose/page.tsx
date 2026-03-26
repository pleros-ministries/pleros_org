import type { Metadata } from "next";

import { PurposePathwayView } from "../../../components/home/purpose-pathway-view";

export const metadata: Metadata = {
  title: "Discover Purpose | Pleros",
  description:
    "Discover purpose through guided Pleros teaching and next steps.",
};

export default function PurposePage() {
  return <PurposePathwayView />;
}
