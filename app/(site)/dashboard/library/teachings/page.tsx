import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";

import { LibraryTable } from "@/app/(site)/library/_components/LibraryTable";
import { PlayerProvider } from "@/app/(site)/library/_components/PlayerContext";
import { getAppSession } from "@/lib/app-session";
import { getAllTeachings } from "@/lib/db/queries/teachings";

export const metadata: Metadata = { title: "Teachings Library" };

// Shares the public library's 60s cache shape: Date → string inside the cache scope.
const getLibraryTeachings = unstable_cache(
  async () => (await getAllTeachings()).map(t => ({ ...t, createdAt: t.createdAt.toISOString() as unknown as Date })),
  ["dashboard-library-teachings"],
  { revalidate: 60 },
);

/** The public Teachings Library inside the dashboard, so learners stay in the app. */
export default async function DashboardTeachingsPage({ searchParams }: { searchParams: Promise<{ series?: string }> }) {
  const [{ series }, session] = await Promise.all([searchParams, getAppSession()]);
  if (!session) redirect("/login?returnTo=/dashboard/library/teachings");
  const teachings = await getLibraryTeachings();
  return <PlayerProvider>
    <div className="site-font-theme flex min-h-[calc(100dvh-var(--dashboard-topbar-offset,0px))] w-full bg-[#f9f9fb]" data-dashboard-public>
      <LibraryTable teachings={teachings} initialSeries={series} compact />
    </div>
  </PlayerProvider>;
}
