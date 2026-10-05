import { describe, expect, test } from "vitest";

import {
  canPostAnywhere,
  canPostOfficial,
  canPostOfficialAnywhere,
  canPostToCommunity,
  canPostToUnit,
  canSeeUnit,
  managesAnyUnit,
  managesUnit,
  type PostPermCtx,
} from "./permissions";

const base: PostPermCtx = {
  isAdmin: false,
  isUnitLeader: false,
  enrollmentId: null,
  unit: null,
  managedUnitIds: [],
};
const admin: PostPermCtx = { ...base, isAdmin: true };
const leader: PostPermCtx = {
  ...base,
  isUnitLeader: true,
  enrollmentId: 21,
  unit: { id: 8 },
};
const member: PostPermCtx = { ...base, enrollmentId: 22, unit: { id: 8 } };
/** A pastor assigned to two regions, with no enrolment of their own. */
const pastor: PostPermCtx = { ...base, managedUnitIds: [8, 12] };
const unenrolled: PostPermCtx = base;

describe("managing a location group", () => {
  test("admins manage every unit", () => {
    expect(managesUnit(admin, 8)).toBe(true);
    expect(managesUnit(admin, 99)).toBe(true);
  });

  test("the assigned pastor manages their regions only", () => {
    expect(managesUnit(pastor, 8)).toBe(true);
    expect(managesUnit(pastor, 12)).toBe(true);
    expect(managesUnit(pastor, 9)).toBe(false);
  });

  test("a member leader manages their own unit only", () => {
    expect(managesUnit(leader, 8)).toBe(true);
    expect(managesUnit(leader, 9)).toBe(false);
  });

  test("ordinary members manage nothing", () => {
    expect(managesUnit(member, 8)).toBe(false);
    expect(managesUnit(member, null)).toBe(false);
    expect(managesAnyUnit(member)).toBe(false);
    expect(managesAnyUnit(pastor)).toBe(true);
  });

  test("a unit is visible to its members and its managers", () => {
    expect(canSeeUnit(member, 8)).toBe(true);
    expect(canSeeUnit(member, 9)).toBe(false);
    expect(canSeeUnit(pastor, 12)).toBe(true);
    expect(canSeeUnit(pastor, 9)).toBe(false);
    expect(canSeeUnit(admin, 9)).toBe(true);
    expect(canSeeUnit(unenrolled, 8)).toBe(false);
  });
});

describe("community posting permissions", () => {
  test("enrolled learners, assigned pastors and admins post community-wide", () => {
    expect(canPostToCommunity(admin)).toBe(true);
    expect(canPostToCommunity(leader)).toBe(true);
    expect(canPostToCommunity(member)).toBe(true);
    expect(canPostToCommunity(pastor)).toBe(true);
    expect(canPostToCommunity(unenrolled)).toBe(false);
    expect(canPostAnywhere(unenrolled)).toBe(false);
  });

  test("a unit takes posts from its members and managers", () => {
    expect(canPostToUnit(member, 8)).toBe(true);
    expect(canPostToUnit(member, 9)).toBe(false);
    expect(canPostToUnit(pastor, 12)).toBe(true);
    expect(canPostToUnit(pastor, 9)).toBe(false);
    expect(canPostToUnit(admin, 99)).toBe(true);
    expect(canPostToUnit(unenrolled, 8)).toBe(false);
  });

  test("announcements stay with admins and a unit's managers", () => {
    expect(canPostOfficial(admin, "global", null)).toBe(true);
    expect(canPostOfficial(admin, "unit", 99)).toBe(true);
    expect(canPostOfficial(leader, "unit", 8)).toBe(true);
    expect(canPostOfficial(leader, "unit", 9)).toBe(false);
    expect(canPostOfficial(pastor, "unit", 12)).toBe(true);
    expect(canPostOfficial(pastor, "unit", 9)).toBe(false);
    expect(canPostOfficial(pastor, "global", null)).toBe(false);
    expect(canPostOfficial(member, "unit", 8)).toBe(false);
  });

  test("canPostOfficialAnywhere covers admins, leaders and pastors", () => {
    expect(canPostOfficialAnywhere(admin)).toBe(true);
    expect(canPostOfficialAnywhere(leader)).toBe(true);
    expect(canPostOfficialAnywhere(pastor)).toBe(true);
    expect(canPostOfficialAnywhere(member)).toBe(false);
  });
});
