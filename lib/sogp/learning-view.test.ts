import { describe, expect, test } from "vitest";
import { podcastSuggestion, learningResume, moveRemainingEpisode } from "./learning-view";
import type { SogpLearningState } from "@/lib/db/queries/sogp-learning";

const state: SogpLearningState = { path: "podcast_two", revision: 2, plan: { episodesPerDay: 2, episodeGuids: ["a","b","c","d"], historyEpisodeGuids: [] }, progress: { listenedEpisodeGuids: ["a"], playbackPositions: [{ episodeGuid: "b", positionSeconds: 285, revision: 1 }] } };
describe("live learning projections", () => {
  test("resumes the partial first day, not a later calendar day", () => {
    expect(learningResume(state)).toEqual({ dayNumber: 1, listened: 1, total: 2, episodeGuids: ["a","b"] });
  });
  test("finished and intentionally empty plans do not fabricate a next episode", () => {
    expect(learningResume({ ...state, progress: { ...state.progress, listenedEpisodeGuids: ["a","b","c","d"] } })).toBeNull();
    expect(learningResume({ ...state, plan: { ...state.plan!, episodeGuids: [] } })).toBeNull();
  });
  test("traditional choice never uses podcast completions as lesson credit", () => {
    expect(learningResume({ ...state, path: "traditional" })).toBeNull();
    expect(learningResume(null)).toBeNull();
  });
  test("matches approved suggestions to current catalogue identifiers without inventing unavailable episodes", () => {
    expect(podcastSuggestion([{ guid: "purpose-2", title: "The Reality of God's Purpose (Part 2)" },{ guid: "purpose-1", title: "The Reality of God’s Purpose (Part 1)" },{ guid: "other", title: "Something else" }], 1)).toEqual(["purpose-1","purpose-2"]);
  });
  test("moves only unfinished slots while completed slots remain at their original indices", () => {
    expect(moveRemainingEpisode(["a","b","c","d"],new Set(["a","c"]),1,3)).toEqual(["a","d","c","b"]);
    expect(() => moveRemainingEpisode(["a","b"],new Set(["a"]),0,1)).toThrow(/completed/i);
  });
});
