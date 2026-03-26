import type { Metadata } from "next";

import { QuestionsPathwayView } from "../../../components/home/questions-pathway-view";

export const metadata: Metadata = {
  title: "Questions | Pleros",
  description:
    "Find answers to honest Gospel questions through the Pleros Questions pathway.",
};

export default function QuestionsPage() {
  return <QuestionsPathwayView />;
}
