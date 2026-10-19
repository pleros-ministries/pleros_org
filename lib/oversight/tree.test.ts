import { describe, expect, it } from "vitest";

import { ancestorsOf, decideOversight, OVERSIGHT_MAX_DEPTH, wouldCreateLoop, type OversightViewer } from "./tree";

// a oversees b, b oversees c, c oversees d.
const overseers = new Map([["b", "a"], ["c", "b"], ["d", "c"]]);
const member: OversightViewer = { userId: "x", isAdmin: false, isPastor: false, branchIds: [] };

describe("ancestorsOf", () => {
  it("walks from the nearest overseer up", () => {
    expect(ancestorsOf(overseers, "d")).toEqual(["c", "b", "a"]);
    expect(ancestorsOf(overseers, "a")).toEqual([]);
  });

  it("stops at a repeat instead of looping forever", () => {
    const looped = new Map([["a", "b"], ["b", "c"], ["c", "a"]]);
    expect(ancestorsOf(looped, "a")).toEqual(["b", "c"]);
  });

  it("stops at the depth limit", () => {
    const long = new Map(Array.from({ length: 80 }, (_, i) => [`u${i}`, `u${i + 1}`] as [string, string]));
    expect(ancestorsOf(long, "u0")).toHaveLength(OVERSIGHT_MAX_DEPTH);
  });
});

describe("wouldCreateLoop", () => {
  it("refuses joining a group you lead", () => {
    expect(wouldCreateLoop([], "a", "a")).toBe(true);
  });

  it("refuses joining a group led by someone you oversee at any depth", () => {
    // a joining d's group: a is above d.
    expect(wouldCreateLoop(ancestorsOf(overseers, "d"), "a", "d")).toBe(true);
    expect(wouldCreateLoop(ancestorsOf(overseers, "d"), "b", "d")).toBe(true);
  });

  it("allows joining a group up the chain or elsewhere", () => {
    expect(wouldCreateLoop(ancestorsOf(overseers, "a"), "d", "a")).toBe(false);
    expect(wouldCreateLoop(ancestorsOf(overseers, "b"), "z", "b")).toBe(false);
  });
});

describe("decideOversight", () => {
  const subject = { subjectId: "d", subjectAncestors: ancestorsOf(overseers, "d"), subjectBranchIds: [3] };

  it("lets anyone up the chain see the report", () => {
    for (const id of ["a", "b", "c"]) expect(decideOversight({ ...subject, viewer: { ...member, userId: id } })).toBe(true);
  });

  it("hides it from people beside or below", () => {
    expect(decideOversight({ ...subject, viewer: member })).toBe(false);
    expect(decideOversight({ subjectId: "b", subjectAncestors: ["a"], subjectBranchIds: [], viewer: { ...member, userId: "c" } })).toBe(false);
  });

  it("never grants yourself through oversight", () => {
    expect(decideOversight({ ...subject, viewer: { ...member, userId: "d", isAdmin: true } })).toBe(false);
  });

  it("lets the Pastor and admins see everyone", () => {
    expect(decideOversight({ ...subject, viewer: { ...member, isPastor: true } })).toBe(true);
    expect(decideOversight({ ...subject, viewer: { ...member, isAdmin: true } })).toBe(true);
  });

  it("lets a branch pastor see people placed in their branches only", () => {
    expect(decideOversight({ ...subject, viewer: { ...member, branchIds: [3, 4] } })).toBe(true);
    expect(decideOversight({ ...subject, viewer: { ...member, branchIds: [4] } })).toBe(false);
  });
});
