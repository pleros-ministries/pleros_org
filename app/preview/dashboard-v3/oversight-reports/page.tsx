import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { OversightReportsMockup, type ReportsMockupPage } from "@/components/dashboard/church/oversight-reports-mockup";

import { sampleFor } from "../oversight-structure/sample";

export const metadata = { title: "Oversight reports mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Mockup of two options for Oversight's Reports tab: `?option=a|b`, `?role=pastor|branch_pastor`. Nothing saves. */
export default async function OversightReportsPreview({ searchParams }: { searchParams: Promise<{ option?: string; page?: string; role?: string; group?: string }> }) {
  const params = await searchParams;
  const option = params.option === "b" ? "b" : "a";
  const page: ReportsMockupPage = params.page === "other" ? "other" : params.page === "group" && option === "b" ? "group" : "reports";
  const role = params.role === "branch_pastor" ? "branch_pastor" : "pastor";
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · Oversight › Reports tab · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3 gap-y-1">
        {link("Option A: your members", `?option=a&role=${role}`, option === "a")}
        {link("Option B: like Structure", `?option=b&role=${role}`, option === "b")}
      </span>
      <span className="flex gap-3">
        {link("Pastor", `?option=${option}&page=${page}&role=pastor${params.group ? `&group=${params.group}` : ""}`, role === "pastor")}
        {link("Branch pastor", `?option=${option}&page=${page}&role=branch_pastor${params.group ? `&group=${params.group}` : ""}`, role === "branch_pastor")}
      </span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <OversightReportsMockup data={sampleFor(role)} option={option} page={page} role={role} groupId={Number(params.group) || undefined} />
    </div>
  </div>;
}
