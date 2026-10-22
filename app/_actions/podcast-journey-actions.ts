"use server";

import { revalidatePath } from "next/cache";

import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { getOwnJourneyGuids } from "@/lib/db/queries/next-learning";
import {
  setPodcastLeaderboardVisible,
  setPodcastTrack,
} from "@/lib/db/queries/podcast-journey";
import {
  buildPodcastSeriesCatalogue,
  isPodcastTrackAvailable,
  PODCAST_OWN_TRACK,
} from "@/lib/podcast-journey";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";

// Expected failures are returned, not thrown: thrown messages are hidden in
// production.
export type PodcastJourneyActionResult =
  | { ok: true }
  | { ok: false; error: string };

const SIGNED_OUT = "You need to be signed in to change your podcast journey.";

/** Starts the chosen journey at Day 1 today. Listened episodes stay ticked. */
export async function choosePodcastTrackAction(
  track: string,
): Promise<PodcastJourneyActionResult> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: SIGNED_OUT };

  const catalogue = buildPodcastSeriesCatalogue(await fetchAnchorEpisodes());
  // Your own journey is available once you've made one.
  const ownReady = track === PODCAST_OWN_TRACK && (await getOwnJourneyGuids(session.user.id)).length > 0;
  if (typeof track !== "string" || (!ownReady && !isPodcastTrackAvailable(track, catalogue))) {
    return {
      ok: false,
      error: "That journey isn’t available right now. Choose another one.",
    };
  }

  await setPodcastTrack(session.user.id, track, toLagosDateKey(new Date()));
  revalidatePath("/dashboard/podcast");
  return { ok: true };
}

export async function setPodcastLeaderboardVisibilityAction(
  visible: boolean,
): Promise<PodcastJourneyActionResult> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: SIGNED_OUT };

  await setPodcastLeaderboardVisible(
    session.user.id,
    visible === true,
    toLagosDateKey(new Date()),
  );
  revalidatePath("/dashboard/podcast");
  revalidatePath("/dashboard/podcast/leaderboard");
  return { ok: true };
}
