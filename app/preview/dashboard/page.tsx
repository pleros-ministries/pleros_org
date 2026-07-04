import type { Metadata } from "next";

import { WelcomeDashboardView } from "@/components/dashboard/welcome-dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard preview | Pleros",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPreviewPage() {
  return <WelcomeDashboardView />;
}
