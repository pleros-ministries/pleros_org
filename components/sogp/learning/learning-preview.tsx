"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import suggestions from "@/lib/sogp/podcast-suggestions.json";
import type { LearningViewData } from "@/lib/sogp/learning-view";
import { LearningHome, PathChooser } from "./learning-home";
import { PlanEditor } from "./plan-editor";
import { ListeningPage } from "./listening-page";

/** Synthetic adapter only. Actions refuse without a session; nothing is saved. */
const episodes = suggestions.suggested60EpisodeDefault.map(row => ({ guid: `yt:${row.videoId}`, title: row.title, duration: row.duration, audioUrl: "" }));
function sample(screen: string): LearningViewData {
  const two = screen.endsWith("two");
  const pace = two ? 2 as const : 1 as const;
  const guids = episodes.slice(0, two ? 60 : 30).map(row => row.guid);
  const listened = screen === "path-new" ? [] : guids.slice(0, two ? 3 : 2);
  return {
    episodes, canWrite: true, writeBlockReason: null, followUp: { name: "Nneka Adeyemi" },
    traditional: { completed: 4, total: 28, nextTitle: "Week 1 · Day 5 · The life of faith", resumeHref: "/dashboard/sogp/traditional" },
    state: screen === "path-new" || screen.startsWith("plan-new") ? null : screen.startsWith("traditional") ? { path: "traditional", revision: 2, plan: null, progress: { listenedEpisodeGuids: [], playbackPositions: [] } }
      : { path: two ? "podcast_two" : "podcast_one", revision: 3, plan: { episodesPerDay: pace, episodeGuids: guids, historyEpisodeGuids: [] }, progress: { listenedEpisodeGuids: listened, playbackPositions: [{ episodeGuid: guids[listened.length], positionSeconds: 312, revision: 1 }] } },
  };
}

export function LearningPreview({ screen }: { screen: string }) {
  const [client] = useState(() => new QueryClient());
  const data = sample(screen);
  const view = screen.startsWith("path") ? <PathChooser data={data} />
    : screen.startsWith("plan") ? <PlanEditor data={data} requestedPath={screen.startsWith("plan-new") ? (screen.endsWith("two") ? "podcast_two" : "podcast_one") : undefined} />
      : screen.startsWith("listen") ? <ListeningPage data={data} />
        : <LearningHome data={data} />;
  return <QueryClientProvider client={client}>{view}</QueryClientProvider>;
}
