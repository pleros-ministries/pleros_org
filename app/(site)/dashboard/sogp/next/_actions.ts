"use server";

import { revalidatePath } from "next/cache";

import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getAppSession } from "@/lib/app-session";
import { getLearningHubData } from "@/lib/dashboard/learning-hub";
import { chooseNextPodcast, saveOwnJourney } from "@/lib/db/queries/next-learning";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";
import { buildFoundationsPlan, buildPodcastSeriesCatalogue, PODCAST_FOUNDATIONS_TRACK, PODCAST_OWN_MAX, podcastSeriesTrack } from "@/lib/podcast-journey";
import { dedupeEpisodes } from "@/lib/podcast-episode-search";

/**
 * Choosing what comes after SOGP (Pastor, 21 October). Expected failures are
 * returned, not thrown: thrown messages are hidden in production.
 */
export type NextLearningResult = { ok: true } | { ok: false; error: string };
export type NextLearningPick = { kind: "foundations" } | { kind: "series"; seriesId: string };

const SIGNED_OUT = "Log in to continue.";
const NOT_YET = "You can choose what’s next once you’ve finished SOGP.";
const FAILED = "Couldn’t save that. Check your connection and try again.";

/** Only someone who has finished SOGP, or whose cohort has ended, chooses what's next. */
async function chooser() {
  const session = await getAppSession();
  if (!session) return { error: SIGNED_OUT } as const;
  const userId: string = session.user.id;
  const view = await getOwnLearningView(userId);
  const hub = view ? await getLearningHubData(userId, view.state) : null;
  if (!hub?.next.canChoose) return { error: NOT_YET } as const;
  return { userId, error: undefined } as const;
}

function refresh() {
  revalidatePath("/dashboard/sogp");
  revalidatePath("/dashboard/sogp/school");
  revalidatePath("/dashboard/podcast");
}

export async function chooseNextLearningAction(pick: NextLearningPick): Promise<NextLearningResult> {
  const who = await chooser();
  if (who.error !== undefined) return { ok: false, error: who.error };
  try {
    const catalogue = buildPodcastSeriesCatalogue(await fetchAnchorEpisodes());
    const track = pick?.kind === "series" && catalogue.some(series => series.id === pick.seriesId && series.episodes.length) ? podcastSeriesTrack(pick.seriesId)
      : pick?.kind === "foundations" && buildFoundationsPlan(catalogue).length ? PODCAST_FOUNDATIONS_TRACK : null;
    if (!track) return { ok: false, error: "That journey isn’t available right now. Choose another one." };
    await chooseNextPodcast(who.userId, track);
  } catch (error) {
    console.error("Next learning choice failed:", error);
    return { ok: false, error: FAILED };
  }
  refresh();
  return { ok: true };
}

/** Saves the episodes picked for your own journey, in order, and starts it at Day 1 today. */
export async function saveOwnJourneyAction(guids: string[]): Promise<NextLearningResult> {
  const who = await chooser();
  if (who.error !== undefined) return { ok: false, error: who.error };
  if (!Array.isArray(guids) || !guids.length) return { ok: false, error: "Add at least one episode." };
  if (guids.length > PODCAST_OWN_MAX) return { ok: false, error: `Your journey can hold up to ${PODCAST_OWN_MAX} episodes.` };
  try {
    const available = new Set(dedupeEpisodes(await fetchAnchorEpisodes()).map(episode => episode.guid));
    const kept = guids.filter(guid => typeof guid === "string" && available.has(guid));
    if (kept.length !== guids.length) return { ok: false, error: "Some of those episodes aren’t available any more. Reload and try again." };
    await saveOwnJourney(who.userId, kept);
  } catch (error) {
    console.error("Own podcast journey failed:", error);
    return { ok: false, error: FAILED };
  }
  refresh();
  return { ok: true };
}
