import type { Metadata } from "next";

import { HomepageFooter } from "@/components/home/homepage-footer";
import { HomepageNav } from "@/components/home/homepage-nav";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import { getAllTeachings } from "@/lib/db/queries/teachings";
import { PlayerProvider } from "./_components/PlayerContext";
import { LibraryTable } from "./_components/LibraryTable";

export const metadata: Metadata = {
  title: "Teaching Library | Pleros",
  description:
    "Browse, search, and listen to the full Pleros teaching archive — Faith & Growth, Gospel & Truth, The New Creation, and more.",
};

export const revalidate = 60;

export default async function LibraryPage() {
  const teachings = await getAllTeachings();

  // Serialise Date → string for client boundary
  const serialised = teachings.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString() as unknown as Date,
  }));

  return (
    <PublicSitePageShell>
      <HomepageNav />
      <PlayerProvider>
        <main className="site-font-theme flex min-h-screen w-full bg-[#f9f9fb]">
          <LibraryTable teachings={serialised} />
        </main>
      </PlayerProvider>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
