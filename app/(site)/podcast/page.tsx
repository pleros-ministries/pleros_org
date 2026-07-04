import type { Metadata } from "next";

import { PodcastPageView } from "../../../components/home/podcast-page-view";

export const metadata: Metadata = {
  title: "Podcast",
  description:
    "Listen to the Pleros Podcast for steady teaching, spiritual encouragement, and clear next steps.",
};

export default function PodcastPage() {
  return <PodcastPageView />;
}
