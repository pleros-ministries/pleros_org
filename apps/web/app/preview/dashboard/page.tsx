import type { Metadata } from "next";

import { WelcomeDashboardView } from "@/components/dashboard/welcome-dashboard-view";
import { welcomeDashboardSections } from "@/lib/welcome-dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard preview",
  robots: {
    index: false,
    follow: false,
  },
};

const previewDashboardSections = welcomeDashboardSections.map((section) => ({
  ...section,
  cards: section.cards.map((card) => {
    if (card.href === "/dashboard/prayer-watch") {
      return { ...card, href: "/preview/dashboard/prayer-watch" };
    }

    if (card.href === "/dashboard/podcast") {
      return { ...card, href: "/preview/dashboard/podcast" };
    }

    if (card.href === "/dashboard/discipleship-journey") {
      return { ...card, href: "/preview/dashboard/discipleship-journey" };
    }

    return card;
  }),
}));

export default function DashboardPreviewPage() {
  return <WelcomeDashboardView sections={previewDashboardSections} />;
}
