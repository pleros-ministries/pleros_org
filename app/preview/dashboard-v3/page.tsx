import type { Metadata } from "next";
import { dashboardFont as font } from "@/components/dashboard/v3/font";
import { DashboardBaseline } from "@/components/dashboard/v3/baseline";

export const metadata: Metadata = { title: "Pleros visual baseline", robots: { index: false, follow: false } };
export default async function BaselinePage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const query = await searchParams;
  const role = query.role === "pastor" || query.role === "unit-leader" || query.role === "admin" || query.role === "instructor" ? query.role : "learner";
  return <div className={font.className}><DashboardBaseline role={role} /></div>;
}
