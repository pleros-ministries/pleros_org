import { describe, expect, it } from "vitest";
import { createPodcastPlan, editPodcastPlan, readPodcastPlan, switchPodcastPace } from "./podcast-plan";

const progress = (listened: string[] = [], positions: [string, number][] = []) => ({
  listenedEpisodeGuids: new Set(listened),
  playbackPositionSeconds: new Map(positions),
});

describe("SOGP podcast learning queue", () => {
  it.each([1, 2] as const)("groups %i episode(s) a day without truncating the suggested slots", pace => {
    const guids = Array.from({ length: 30 * pace }, (_, i) => `episode-${i + 1}`);
    const read = readPodcastPlan(createPodcastPlan(guids, pace), progress());
    expect(read.days).toHaveLength(30);
    expect(read.days.flatMap(day => day.episodes.map(episode => episode.episodeGuid))).toEqual(guids);
    expect(read.nextDay?.dayNumber).toBe(1);
  });

  it("keeps a missed partial day waiting rather than regrouping on every read", () => {
    const plan = createPodcastPlan(["a", "b", "c", "d"], 2);
    const read = readPodcastPlan(plan, progress(["a"], [["b", 285]]));
    expect(read.nextDay).toEqual({ dayNumber: 1, complete: false, episodes: [
      { episodeGuid: "a", listened: true, playbackPositionSeconds: null },
      { episodeGuid: "b", listened: false, playbackPositionSeconds: 285 },
    ] });
    expect(read.days[1]?.episodes.map(episode => episode.episodeGuid)).toEqual(["c", "d"]);
  });

  it("requires both explicit marks; playback reaching the end awards no completion", () => {
    const plan = createPodcastPlan(["a", "b"], 2);
    expect(readPodcastPlan(plan, progress(["a"], [["b", 9999]])).days[0]?.complete).toBe(false);
    expect(readPodcastPlan(plan, progress(["a", "b"])).days[0]?.complete).toBe(true);
    expect(readPodcastPlan(plan, progress(["a", "b"])).nextDay).toBeNull();
  });

  it("chooses the earliest unfinished day even if a later day was completed", () => {
    const read = readPodcastPlan(createPodcastPlan(["a", "b", "c"], 1), progress(["b"]));
    expect(read.nextDay?.dayNumber).toBe(1);
    expect(read.days.map(day => day.complete)).toEqual([false, true, false]);
  });

  it("completes an odd final day using only its actual episode", () => {
    const read = readPodcastPlan(createPodcastPlan(["a", "b", "c"], 2), progress(["a", "b"]));
    expect(read.nextDay?.episodes.map(episode => episode.episodeGuid)).toEqual(["c"]);
    expect(readPodcastPlan(createPodcastPlan(["a", "b", "c"], 2), progress(["a", "b", "c"])).nextDay).toBeNull();
  });

  it("has no next day for an empty plan, without inventing completion or content", () => {
    expect(readPodcastPlan(createPodcastPlan([], 2), progress())).toEqual({ days: [], history: [], nextDay: null });
  });

  it("retains zero playback separately from an unknown position", () => {
    const read = readPodcastPlan(createPodcastPlan(["a", "b"], 2), progress([], [["a", 0]]));
    expect(read.days[0]?.episodes.map(episode => episode.playbackPositionSeconds)).toEqual([0, null]);
  });
});

describe("pace switching preserves history", () => {
  it("switches two to one without dropping 59 remaining episodes to fit 30 days", () => {
    const guids = Array.from({ length: 60 }, (_, i) => `e${i + 1}`);
    const source = createPodcastPlan(guids, 2);
    const facts = progress(["e1", "old-outside-plan"], [["e2", 285]]);
    const next = switchPodcastPace(source, 1, facts);
    expect(next.historyEpisodeGuids).toEqual(["e1"]);
    expect(next.episodeGuids).toEqual(guids.slice(1));
    expect(readPodcastPlan(next, facts).days).toHaveLength(59);
    expect(readPodcastPlan(next, facts).nextDay?.episodes).toEqual([
      { episodeGuid: "e2", listened: false, playbackPositionSeconds: 285 },
    ]);
    expect([...facts.listenedEpisodeGuids]).toEqual(["e1", "old-outside-plan"]);
    expect(source.episodeGuids).toEqual(guids);
  });

  it("switches one to two, preserves earlier history and keeps an odd remainder", () => {
    const plan = { ...createPodcastPlan(["a", "b", "c", "d"], 1), historyEpisodeGuids: ["past"] };
    const facts = progress(["a", "past"]);
    const next = switchPodcastPace(plan, 2, facts);
    expect(next.historyEpisodeGuids).toEqual(["past", "a"]);
    expect(readPodcastPlan(next, facts).days.map(day => day.episodes.map(episode => episode.episodeGuid))).toEqual([["b", "c"], ["d"]]);
    expect(switchPodcastPace(next, 1, facts).episodeGuids).toEqual(["b", "c", "d"]);
    expect(switchPodcastPace(next, 1, facts).historyEpisodeGuids).toEqual(["past", "a"]);
  });

  it("a repeated same-pace selection does not regroup a partial day", () => {
    const plan = createPodcastPlan(["a", "b", "c", "d"], 2);
    expect(switchPodcastPace(plan, 2, progress(["a"]))).toEqual(plan);
  });

  it("repeated pace switches never duplicate archived history or lose remaining items", () => {
    const facts = progress(["a"]);
    const one = switchPodcastPace(createPodcastPlan(["a", "b", "c", "d"], 2), 1, facts);
    const two = switchPodcastPace(one, 2, facts);
    const again = switchPodcastPace(two, 1, facts);
    expect(again).toEqual({ episodesPerDay: 1, episodeGuids: ["b", "c", "d"], historyEpisodeGuids: ["a"] });
  });

  it("archived references do not manufacture explicit listen marks", () => {
    const plan = { ...createPodcastPlan(["b"], 1), historyEpisodeGuids: ["a"] };
    expect(readPodcastPlan(plan, progress()).history).toEqual([
      { episodeGuid: "a", listened: false, playbackPositionSeconds: null },
    ]);
    expect(readPodcastPlan(plan, progress()).nextDay?.complete).toBe(false);
  });
});

describe("editing the complete remaining plan", () => {
  const available = new Set(["a", "b", "c", "d", "replacement"]);
  it("reorders/replaces only unfinished episodes while keeping completed slots fixed", () => {
    const plan = createPodcastPlan(["a", "b", "c", "d"], 2);
    const facts = progress(["a"], [["c", 42]]);
    const next = editPodcastPlan(plan, ["a", "c", "replacement", "b"], facts, available);
    expect(next.episodeGuids).toEqual(["a", "c", "replacement", "b"]);
    expect(next.episodesPerDay).toBe(2);
    expect(readPodcastPlan(next, facts).nextDay?.episodes[1]?.playbackPositionSeconds).toBe(42);
    expect(plan.episodeGuids).toEqual(["a", "b", "c", "d"]);
  });

  it.each([["b", "a", "c"], ["replacement", "b", "c"], ["b", "c"]].map(desired => [desired] as const))("refuses moving, replacing or removing a completed slot: %j", desired => {
    expect(() => editPodcastPlan(createPodcastPlan(["a", "b", "c"], 1), desired, progress(["a"]), available)).toThrow(/completed/i);
  });

  it("keeps an unavailable existing episode without silently replacing it", () => {
    const plan = createPodcastPlan(["missing-from-feed", "b"], 1);
    expect(editPodcastPlan(plan, ["missing-from-feed", "replacement"], progress(), available).episodeGuids).toEqual(["missing-from-feed", "replacement"]);
    expect(() => editPodcastPlan(plan, ["not-in-feed", "b"], progress(), available)).toThrow(/available/i);
  });

  it("validates the last slot of the full 60-episode draft and leaves the source unchanged", () => {
    const guids = Array.from({ length: 60 }, (_, i) => `e${i + 1}`);
    const plan = createPodcastPlan(guids, 2);
    const desired = [...guids]; desired[59] = "unavailable";
    expect(() => editPodcastPlan(plan, desired, progress(), new Set(guids))).toThrow(/available/i);
    expect(plan.episodeGuids.at(-1)).toBe("e60");
    expect(plan.episodeGuids).toHaveLength(60);
  });

  it.each([["a", "a"], ["a", ""], ["a", "   "]].map(desired => [desired] as const))("rejects invalid queue identifiers: %j", desired => {
    expect(() => createPodcastPlan(desired, 1)).toThrow();
    expect(() => editPodcastPlan(createPodcastPlan(["a", "b"], 1), desired, progress(), available)).toThrow();
  });

  it("rejects a string passed instead of an episode array", () => {
    expect(() => createPodcastPlan("ab" as unknown as string[], 1)).toThrow(/array/i);
  });

  it("refuses unsupported pacing rather than inventing another path", () => {
    expect(() => createPodcastPlan(["a"], 3 as 1)).toThrow(/pace/i);
    expect(() => switchPodcastPace(createPodcastPlan(["a"], 1), 0 as 1, progress())).toThrow(/pace/i);
  });

  it("works with frozen inputs and never changes listen or playback projections", () => {
    const guids = Object.freeze(["a", "b", "c"]);
    const history = Object.freeze(["older"]);
    const plan = Object.freeze({ ...createPodcastPlan(guids, 2), episodeGuids: guids, historyEpisodeGuids: history });
    const facts = progress(["a", "older"], [["b", 285]]);
    const before = { listened: [...facts.listenedEpisodeGuids], positions: [...facts.playbackPositionSeconds] };
    switchPodcastPace(plan, 1, facts);
    editPodcastPlan(plan, ["a", "c", "b"], facts, available);
    readPodcastPlan(plan, facts);
    expect(plan).toEqual({ episodesPerDay: 2, episodeGuids: ["a", "b", "c"], historyEpisodeGuids: ["older"] });
    expect({ listened: [...facts.listenedEpisodeGuids], positions: [...facts.playbackPositionSeconds] }).toEqual(before);
  });
});
