import type { Metadata } from "next";
import { redirect } from "next/navigation";

import styles from "@/components/sogp/learning/learning-hub.module.css";
import { NextLearningChooser, type NextOption } from "@/components/sogp/next-learning/next-learning-chooser";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getAppSession } from "@/lib/app-session";
import { getLearningHubData } from "@/lib/dashboard/learning-hub";
import { getNextLearning } from "@/lib/db/queries/next-learning";
import { ensurePodcastJourney } from "@/lib/db/queries/podcast-journey";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";
import { buildFoundationsPlan, buildPodcastSeriesCatalogue, PODCAST_FOUNDATIONS_TRACK, PODCAST_OWN_TRACK } from "@/lib/podcast-journey";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "What’s next" };

/** What's next after SOGP (Pastor, 21 October): podcast journeys only; separate teachings aren't offered (user, 22 October). */
export default async function NextLearningPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/next");
  const userId = session.user.id;
  const view = await getOwnLearningView(userId);
  if (!view) redirect("/sogp/enrol");
  const [hub, episodes, choice] = await Promise.all([
    getLearningHubData(userId, view.state).catch(() => null),
    fetchAnchorEpisodes(),
    getNextLearning(userId).catch(() => null),
  ]);
  if (!hub?.next.canChoose) redirect("/dashboard/sogp");
  // The stored podcast track only marks "Current" once a podcast is the chosen next learning.
  const track = choice?.kind === "podcast" ? (await ensurePodcastJourney(userId, toLagosDateKey(new Date()))).track : null;

  const catalogue = buildPodcastSeriesCatalogue(episodes);
  const foundations = buildFoundationsPlan(catalogue);
  const options: NextOption[] = [
    ...(foundations.length ? [{ key: "foundations", art: "podcast" as const, title: "The Foundations podcast", detail: "The Place of the Gospel, The Reality and Pursuit of God’s Purpose, and How to Fulfil it", meta: `${foundations.length} days · one episode a day`, pick: { kind: "foundations" as const }, current: track === PODCAST_FOUNDATIONS_TRACK }] : []),
    ...(catalogue.length ? [{ key: "series", art: "library" as const, title: "A series from the Library", detail: "Pick a teaching series and listen through it, one episode a day", meta: "Choose the series next", href: "/dashboard/sogp/next/series", current: Boolean(track?.startsWith("series:")) }] : []),
    { key: "own", art: "sogp", title: "Your own podcast journey", detail: "Pick the episodes you want, in the order you want, one a day", meta: "Choose your episodes next", href: "/dashboard/sogp/next/own", current: track === PODCAST_OWN_TRACK },
  ];

  return <div className={styles.page}><div className={styles.column}>
    <NextLearningChooser options={options} advancedInterest={hub.advancedInterest} />
  </div></div>;
}
