import type { Metadata } from "next";

import { VisionMissionPageView } from "../../../components/home/vision-mission-page-view";

export const metadata: Metadata = {
  title: "Vision & Mission | Pleros",
  description: "Read the vision and mission of Pleros Ministries and Missions.",
};

export default function VisionMissionPage() {
  return <VisionMissionPageView />;
}
