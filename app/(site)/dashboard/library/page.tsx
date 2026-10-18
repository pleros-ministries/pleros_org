import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";

import { LibraryHome } from "@/components/dashboard/library/library-home";
import { getAppSession } from "@/lib/app-session";
import { getTeachingSeriesCounts } from "@/lib/db/queries/teachings";

export const metadata: Metadata = { title: "Library" };

// The archive changes rarely; the public library caches for the same 60s.
const getSeries = unstable_cache(getTeachingSeriesCounts, ["dashboard-library-series"], { revalidate: 60 });

export default async function DashboardLibraryPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/library");
  const series = await getSeries().catch(() => []);
  return <LibraryHome series={series} />;
}
