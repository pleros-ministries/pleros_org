import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";

import { HomepageFooter } from "@/components/home/homepage-footer";
import { HomepageNav } from "@/components/home/homepage-nav";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import { getAllTeachings } from "@/lib/db/queries/teachings";
import { PlayerProvider } from "./_components/PlayerContext";
import { LibraryTable } from "./_components/LibraryTable";

export const metadata: Metadata = {
  title: "Teaching Library",
  description:
    "Browse, search, and listen to the full Pleros teaching archive — Faith & Growth, Gospel & Truth, The New Creation, and more.",
};

// Cached for 60s across requests. Serialise Date → string inside the cache
// scope, since unstable_cache stores JSON and the client boundary needs strings.
const getLibraryTeachings = unstable_cache(
  async () => {
    const teachings = await getAllTeachings();
    return teachings.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString() as unknown as Date,
    }));
  },
  ["site-library-teachings"],
  { revalidate: 60 },
);

export default async function LibraryPage() {
  // Render at request time so `next build` never needs a reachable database.
  await connection();
  const serialised = await getLibraryTeachings();

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
