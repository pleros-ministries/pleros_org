import type { Metadata } from "next";
import { dashboardFont } from "@/components/dashboard/v3/font";
import { MinistryReportPreview } from "@/components/community/report/ministry-v3/preview";

// Reads searchParams on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Pleros ministry report preview", robots: { index: false, follow: false } };

export default async function ReportPreviewPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const params = await searchParams;
  return <div className={dashboardFont.className}><MinistryReportPreview kind={params.kind === "discipleship" ? "follow_up" : "outreach"} /></div>;
}
