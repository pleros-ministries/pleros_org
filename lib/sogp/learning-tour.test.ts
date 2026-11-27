import { describe, expect, it } from "vitest";

import { resumeIndex, routeOf, syncToRoute, tourInput, tourSteps } from "./learning-tour";

const names = { firstName: "Sam", leaderFirstName: null };

describe("learning tour steps", () => {
  it("asks for a path before branching", () => {
    expect(tourSteps(null, null, names).map(step => step.id)).toEqual(["welcome", "start", "paths", "pick"]);
  });
  it("follows each path through to Home, with ids unique within a tour", () => {
    for (const [path, mode] of [["sogp", null], ["podcast", "suggested"], ["podcast", "own"], ["doctrinal", null]] as const) {
      const ids = tourSteps(path, mode, names).map(step => step.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.at(-1)).toBe("done");
      expect(ids).toContain("your-path");
    }
  });
  it("adds the leader step only after a group-link join, and names them", () => {
    expect(tourSteps("sogp", null, names).some(step => step.id === "leader")).toBe(false);
    const linked = tourSteps("sogp", null, { firstName: "Sam", leaderFirstName: "Ada" });
    expect(linked.find(step => step.id === "leader")?.title).toBe("Ada looks after you");
    expect(linked[0]!.body).toContain("You joined Ada’s group");
  });
  it("walks Podcast's Build my own through the picker", () => {
    const ids = tourSteps("podcast", "own", names).map(step => step.id);
    expect(ids).toEqual(expect.arrayContaining(["tabs", "own-add", "own-tray", "own-start"]));
    expect(ids).not.toContain("use");
  });
  it("never equates the doctrinal path with SOGP", () => {
    const copy = ["sogp", "podcast", "doctrinal"].flatMap(path => tourSteps(path as never, "own", names)).map(step => `${step.title} ${step.body}`).join(" ");
    expect(copy).not.toMatch(/then SOGP|SOGP’s teachings/);
  });
});

describe("resuming and skipping ahead", () => {
  const steps = tourSteps("sogp", null, names);
  it("resumes at the saved step, or the start when it's gone", () => {
    expect(steps[resumeIndex(steps, "tracks")]!.id).toBe("tracks");
    expect(resumeIndex(steps, "no-such-step")).toBe(0);
    expect(resumeIndex(steps, null)).toBe(0);
  });
  it("jumps to the first later step on the page they reached", () => {
    const go = steps.findIndex(step => step.id === "go");
    expect(steps[syncToRoute(steps, go, "learning")]!.id).toBe("card");
    expect(syncToRoute(steps, go, "choose")).toBe(go);
    expect(syncToRoute(steps, go, null)).toBe(go);
  });
  it("never jumps backwards", () => {
    const card = steps.findIndex(step => step.id === "card");
    expect(syncToRoute(steps, card, "choose")).toBe(card);
  });
  it("maps dashboard paths to tour routes", () => {
    expect(routeOf("/dashboard")).toBe("home");
    expect(routeOf("/dashboard/sogp/path/")).toBe("choose");
    expect(routeOf("/dashboard/sogp")).toBe("learning");
    expect(routeOf("/dashboard/library")).toBeNull();
  });
});

describe("saving progress", () => {
  it("accepts known values only", () => {
    expect(tourInput({ status: "active", step: "own-add", path: "podcast", mode: "own" })).toEqual({ status: "active", step: "own-add", path: "podcast", mode: "own" });
    expect(tourInput({ status: "done" })).toEqual({ status: "done", step: null, path: null, mode: null });
    for (const bad of [null, [], { status: "paused" }, { status: "active", step: "Drop table" }, { status: "active", path: "traditional" }, { status: "active", mode: "mine" }]) {
      expect(() => tourInput(bad)).toThrow();
    }
  });
});
