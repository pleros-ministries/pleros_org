import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { OversightOtherGroups, OversightStructure } from "@/components/dashboard/church/group-oversight-view";

import { sampleFor } from "./sample";

export const metadata = { title: "Oversight structure preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** The real Structure and Every other group views on sample data: `?page=structure|other`, `?role=pastor|branch_pastor`. Nothing saves. */
export default async function OversightStructurePreview({ searchParams }: { searchParams: Promise<{ page?: string; role?: string }> }) {
  const params = await searchParams;
  const page = params.page === "other" ? "other" : "structure";
  const role = params.role === "branch_pastor" ? "branch_pastor" : "pastor";
  const data = sampleFor(role);
  const tab = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Preview · sample data · nothing saved</span>
      <span className="flex gap-3">
        {tab("Pastor", `?page=${page}&role=pastor`, role === "pastor")}
        {tab("Branch pastor", `?page=${page}&role=branch_pastor`, role === "branch_pastor")}
      </span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      {page === "other" ? <OversightOtherGroups data={data} /> : <OversightStructure data={data} updates={3} />}
    </div>
  </div>;
}
