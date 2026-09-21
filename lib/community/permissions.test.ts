import { describe, expect, test } from "vitest";

import {
  canPostAnywhere,
  canPostToCommunity,
  canPostToUnit,
  type PostPermCtx,
} from "./permissions";

const admin: PostPermCtx = { isAdmin: true, isUnitLeader: false, unit: null };
const leader: PostPermCtx = {
  isAdmin: false,
  isUnitLeader: true,
  unit: { id: 8 },
};
const member: PostPermCtx = {
  isAdmin: false,
  isUnitLeader: false,
  unit: { id: 8 },
};

describe("community posting permissions", () => {
  test("only admins can post community-wide", () => {
    expect(canPostToCommunity(admin)).toBe(true);
    expect(canPostToCommunity(leader)).toBe(false);
    expect(canPostToCommunity(member)).toBe(false);
  });

  test("a leader can post to their own unit only", () => {
    expect(canPostToUnit(leader, 8)).toBe(true);
    expect(canPostToUnit(leader, 9)).toBe(false);
  });

  test("an admin can post to any unit", () => {
    expect(canPostToUnit(admin, 8)).toBe(true);
    expect(canPostToUnit(admin, 99)).toBe(true);
  });

  test("a plain member can post nowhere", () => {
    expect(canPostToUnit(member, 8)).toBe(false);
    expect(canPostAnywhere(member)).toBe(false);
  });

  test("canPostAnywhere covers admins and leaders", () => {
    expect(canPostAnywhere(admin)).toBe(true);
    expect(canPostAnywhere(leader)).toBe(true);
  });
});
