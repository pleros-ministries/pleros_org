import type { Metadata } from "next";

import { AboutPageView } from "../../../components/home/about-page-view";

export const metadata: Metadata = {
  title: "About Us | Pleros",
  description: "Learn more about Pleros Ministries and Missions.",
};

export default function AboutPage() {
  return <AboutPageView />;
}
