/**
 * Additive SOGP plan rules, independent of legacy calendar journeys and storage.
 * Canonical listens/playback are supplied by the owner-scoped persistence layer;
 * plan references never award completion, traditional credit or certification.
 */
export type PodcastPace = 1 | 2;

export type PodcastLearningPlan = {
  episodesPerDay: PodcastPace;
  episodeGuids: readonly string[];
  /** References kept when a pace switch removes completed items from the queue.
   * These are NOT a completion ledger; always read the canonical listen source. */
  historyEpisodeGuids: readonly string[];
};

export type PodcastLearningProgress = {
  listenedEpisodeGuids: ReadonlySet<string>;
  playbackPositionSeconds: ReadonlyMap<string, number>;
};

export type PodcastLearningEpisode = {
  episodeGuid: string;
  listened: boolean;
  playbackPositionSeconds: number | null;
};

export type PodcastLearningDay = {
  dayNumber: number;
  episodes: PodcastLearningEpisode[];
  complete: boolean;
};

function requirePace(pace: PodcastPace) {
  if (pace !== 1 && pace !== 2) throw new Error("Choose a pace of one or two episodes per day.");
}

function requireUniqueGuids(guids: readonly string[]) {
  if (!Array.isArray(guids)) throw new Error("Choose an array of episode identifiers.");
  const seen = new Set<string>();
  for (const guid of guids) {
    if (typeof guid !== "string" || !guid.trim() || guid.trim() !== guid) {
      throw new Error("Choose a valid episode identifier.");
    }
    if (seen.has(guid)) throw new Error("An episode can appear only once in the queue.");
    seen.add(guid);
  }
}

function copyPlan(plan: PodcastLearningPlan): PodcastLearningPlan {
  requirePace(plan.episodesPerDay);
  requireUniqueGuids(plan.episodeGuids);
  requireUniqueGuids(plan.historyEpisodeGuids);
  return { episodesPerDay: plan.episodesPerDay, episodeGuids: [...plan.episodeGuids], historyEpisodeGuids: [...plan.historyEpisodeGuids] };
}

/** Suggested lengths belong to the catalogue adapter, not a truncation rule. */
export function createPodcastPlan(episodeGuids: readonly string[], episodesPerDay: PodcastPace): PodcastLearningPlan {
  return copyPlan({ episodeGuids, episodesPerDay, historyEpisodeGuids: [] });
}

function describeEpisode(episodeGuid: string, progress: PodcastLearningProgress): PodcastLearningEpisode {
  return {
    episodeGuid,
    listened: progress.listenedEpisodeGuids.has(episodeGuid),
    playbackPositionSeconds: progress.playbackPositionSeconds.get(episodeGuid) ?? null,
  };
}

/** No clock/date input: unfinished learning cannot disappear as time advances. */
export function readPodcastPlan(plan: PodcastLearningPlan, progress: PodcastLearningProgress): {
  days: PodcastLearningDay[];
  history: PodcastLearningEpisode[];
  nextDay: PodcastLearningDay | null;
} {
  const valid = copyPlan(plan);
  const days: PodcastLearningDay[] = [];
  for (let offset = 0; offset < valid.episodeGuids.length; offset += valid.episodesPerDay) {
    const episodes = valid.episodeGuids.slice(offset, offset + valid.episodesPerDay).map(guid => describeEpisode(guid, progress));
    days.push({ dayNumber: days.length + 1, episodes, complete: episodes.length > 0 && episodes.every(episode => episode.listened) });
  }
  return {
    days,
    history: valid.historyEpisodeGuids.map(guid => describeEpisode(guid, progress)),
    nextDay: days.find(day => !day.complete) ?? null,
  };
}

/** Only an explicit change of pace regroups the exact remaining sequence. */
export function switchPodcastPace(plan: PodcastLearningPlan, nextPace: PodcastPace, progress: PodcastLearningProgress): PodcastLearningPlan {
  requirePace(nextPace);
  const current = copyPlan(plan);
  if (current.episodesPerDay === nextPace) return current;

  const completed = current.episodeGuids.filter(guid => progress.listenedEpisodeGuids.has(guid));
  return {
    episodesPerDay: nextPace,
    episodeGuids: current.episodeGuids.filter(guid => !progress.listenedEpisodeGuids.has(guid)),
    historyEpisodeGuids: [...new Set([...current.historyEpisodeGuids, ...completed])],
  };
}

/** Validate the complete draft before accepting it; the caller persists atomically. */
export function editPodcastPlan(plan: PodcastLearningPlan, desiredEpisodeGuids: readonly string[], progress: PodcastLearningProgress, availableEpisodeGuids: ReadonlySet<string>): PodcastLearningPlan {
  const current = copyPlan(plan);
  requireUniqueGuids(desiredEpisodeGuids);
  current.episodeGuids.forEach((guid, index) => {
    if (progress.listenedEpisodeGuids.has(guid) && desiredEpisodeGuids[index] !== guid) {
      throw new Error("Completed episodes cannot be moved, replaced or removed.");
    }
  });

  const retained = new Set(current.episodeGuids);
  for (const guid of desiredEpisodeGuids) {
    if (!retained.has(guid) && !availableEpisodeGuids.has(guid)) {
      throw new Error("That episode is not available. Your current plan is unchanged.");
    }
  }
  return { ...current, episodeGuids: [...desiredEpisodeGuids] };
}
