import { describe, expect, test } from "vitest";

import {
  GROUP_DESCRIPTION_MAX,
  GROUP_NAME_MAX,
  canManageGroupMember,
  canModerateGroup,
  canPostInGroup,
  canViewGroupContent,
  evaluateGroupJoin,
  managesGroup,
  normaliseGroupInput,
  ownsGroup,
  type GroupAccess,
} from "./groups";

function access(overrides: Partial<GroupAccess> = {}): GroupAccess {
  return {
    groupId: 1,
    privacy: "public",
    status: "active",
    membership: null,
    ...overrides,
  };
}

const member = { role: "member", status: "active" } as const;
const moderator = { role: "moderator", status: "active" } as const;
const owner = { role: "owner", status: "active" } as const;
const pending = { role: "member", status: "pending" } as const;
const banned = { role: "member", status: "banned" } as const;

describe("normaliseGroupInput", () => {
  test("tidies the name and defaults to a public group", () => {
    expect(
      normaliseGroupInput({ name: "  Lagos   young adults ", description: " Hi " }),
    ).toEqual({
      ok: true,
      value: { name: "Lagos young adults", description: "Hi", privacy: "public" },
    });
  });

  test("accepts private and ignores unknown privacy values", () => {
    const priv = normaliseGroupInput({ name: "Prayer", privacy: "private" });
    expect(priv.ok && priv.value.privacy).toBe("private");
    const odd = normaliseGroupInput({ name: "Prayer", privacy: "secret" });
    expect(odd.ok && odd.value.privacy).toBe("public");
  });

  test("rejects names and descriptions outside the limits", () => {
    expect(normaliseGroupInput({ name: "ab" }).ok).toBe(false);
    expect(normaliseGroupInput({ name: "x".repeat(GROUP_NAME_MAX + 1) }).ok).toBe(
      false,
    );
    expect(
      normaliseGroupInput({
        name: "Prayer",
        description: "x".repeat(GROUP_DESCRIPTION_MAX + 1),
      }).ok,
    ).toBe(false);
  });
});

describe("group visibility and posting", () => {
  test("anyone reads a public group but only members post", () => {
    expect(canViewGroupContent(access(), false)).toBe(true);
    expect(canPostInGroup(access())).toBe(false);
    expect(canPostInGroup(access({ membership: member }))).toBe(true);
  });

  test("a private group is for its members only", () => {
    const priv = access({ privacy: "private" });
    expect(canViewGroupContent(priv, false)).toBe(false);
    expect(canViewGroupContent({ ...priv, membership: pending }, false)).toBe(
      false,
    );
    expect(canViewGroupContent({ ...priv, membership: member }, false)).toBe(
      true,
    );
  });

  test("an archived group is closed to everyone but admins", () => {
    const archived = access({ status: "archived", membership: owner });
    expect(canViewGroupContent(archived, false)).toBe(false);
    expect(canPostInGroup(archived)).toBe(false);
    expect(canViewGroupContent(archived, true)).toBe(true);
  });

  test("admins can see any private group", () => {
    expect(canViewGroupContent(access({ privacy: "private" }), true)).toBe(true);
  });
});

describe("group management", () => {
  test("owners and moderators manage; members and outsiders do not", () => {
    expect(managesGroup(access({ membership: owner }))).toBe(true);
    expect(managesGroup(access({ membership: moderator }))).toBe(true);
    expect(managesGroup(access({ membership: member }))).toBe(false);
    expect(managesGroup(access())).toBe(false);
    expect(ownsGroup(access({ membership: moderator }))).toBe(false);
  });

  test("a pending or banned moderator has no powers", () => {
    expect(
      managesGroup(access({ membership: { role: "moderator", status: "pending" } })),
    ).toBe(false);
    expect(canModerateGroup(access({ membership: banned }), false)).toBe(false);
  });

  test("admins can moderate any group", () => {
    expect(canModerateGroup(access(), true)).toBe(true);
    expect(canModerateGroup(access({ membership: member }), false)).toBe(false);
  });

  test("nobody manages the owner, and moderators manage members only", () => {
    expect(canManageGroupMember("owner", "owner", false)).toBe(false);
    expect(canManageGroupMember(null, "owner", true)).toBe(false);
    expect(canManageGroupMember("owner", "moderator", false)).toBe(true);
    expect(canManageGroupMember("moderator", "member", false)).toBe(true);
    expect(canManageGroupMember("moderator", "moderator", false)).toBe(false);
    expect(canManageGroupMember("member", "member", false)).toBe(false);
    expect(canManageGroupMember(null, "member", true)).toBe(true);
  });
});

describe("evaluateGroupJoin", () => {
  test("public groups admit at once, private groups take a request", () => {
    expect(evaluateGroupJoin(access())).toEqual({ action: "join" });
    expect(evaluateGroupJoin(access({ privacy: "private" }))).toEqual({
      action: "request",
    });
  });

  test("existing members, pending requests and bans are not re-added", () => {
    expect(evaluateGroupJoin(access({ membership: member }))).toEqual({
      action: "none",
      reason: "member",
    });
    expect(evaluateGroupJoin(access({ membership: pending }))).toEqual({
      action: "none",
      reason: "pending",
    });
    expect(evaluateGroupJoin(access({ membership: banned }))).toEqual({
      action: "none",
      reason: "banned",
    });
  });

  test("an archived group takes no one", () => {
    expect(evaluateGroupJoin(access({ status: "archived" }))).toEqual({
      action: "none",
      reason: "archived",
    });
  });
});
