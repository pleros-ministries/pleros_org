import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";

import { LibraryHome } from "@/components/dashboard/library/library-home";
import { getAppSession } from "@/lib/app-session";
import { hasAdvancedSogpInterest } from "@/lib/db/queries/advanced-sogp-interest";
import { getTeachingSeriesCounts } from "@/lib/db/queries/teachings";

export const metadata: Metadata = { title: "Library" };

// The archive changes rarely; the public library caches for the same 60s.
const getSeries = unstable_cache(getTeachingSeriesCounts, ["dashboard-library-series"], { revalidate: 60 });

export default async function DashboardLibraryPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/library");
  const [series, advancedInterest] = await Promise.all([
    getSeries().catch(() => []),
    hasAdvancedSogpInterest(session.user.id).catch(() => false),
  ]);
  return <LibraryHome series={series} advancedInterest={advancedInterest} />;
}
