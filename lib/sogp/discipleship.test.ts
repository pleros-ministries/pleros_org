import { describe, expect, test } from "vitest";

import {
  DISCIPLESHIP_GROUP_MAX,
  DISCIPLESHIP_GROUP_NAME_MAX,
  DISCIPLESHIP_GROUPS_LED_MAX,
  GENERIC_PROMPT_SUGGESTIONS,
  buildCurriculumPromptSuggestions,
  buildWeeklyDigest,
  isDigestDay,
  shouldAlertStatusChange,
  buildDiscipleshipInviteUrl,
  buildWhatsAppUrl,
  defaultDiscipleshipGroupName,
  evaluateCloseDiscipleshipGroup,
  evaluateCreateDiscipleshipGroup,
  evaluateDiscipleshipJoin,
  generateInviteCode,
  isValidInviteCode,
  validateDiscipleshipGroupName,
} from "./discipleship";

describe("generateInviteCode", () => {
  test("is 8 lowercase hex chars and validates", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[0-9a-f]{8}$/);
    expect(isValidInviteCode(code)).toBe(true);
  });

  test("rejects malformed codes", () => {
    expect(isValidInviteCode("ABCDEF12")).toBe(false);
    expect(isValidInviteCode("abc")).toBe(false);
    expect(isValidInviteCode(null)).toBe(false);
  });
});

describe("buildDiscipleshipInviteUrl", () => {
  test("joins the site url and code without double slashes", () => {
    expect(buildDiscipleshipInviteUrl("https://pleros.org/", "ab12cd34")).toBe(
      "https://pleros.org/sogp/discipleship/ab12cd34",
    );
  });
});

describe("defaultDiscipleshipGroupName", () => {
  test("uses the first name when present", () => {
    expect(defaultDiscipleshipGroupName("Tola")).toBe("Tola's discipleship group");
    expect(defaultDiscipleshipGroupName(" ")).toBe("Discipleship group");
  });
});

describe("validateDiscipleshipGroupName", () => {
  test("trims and collapses whitespace", () => {
    expect(validateDiscipleshipGroupName("  Campus   fellowship ")).toEqual({
      ok: true,
      name: "Campus fellowship",
    });
  });

  test("rejects names that are too short, too long or not text", () => {
    expect(validateDiscipleshipGroupName("ab").ok).toBe(false);
    expect(validateDiscipleshipGroupName("   ").ok).toBe(false);
    expect(validateDiscipleshipGroupName(null).ok).toBe(false);
    expect(
      validateDiscipleshipGroupName("x".repeat(DISCIPLESHIP_GROUP_NAME_MAX + 1)).ok,
    ).toBe(false);
    expect(validateDiscipleshipGroupName("x".repeat(DISCIPLESHIP_GROUP_NAME_MAX)).ok).toBe(true);
  });

  test("rejects a name the leader already uses, whatever the case", () => {
    expect(validateDiscipleshipGroupName("family", ["Family", "Campus"])).toEqual({
      ok: false,
      error: "You already have a group with this name.",
    });
    expect(validateDiscipleshipGroupName("Friends", ["Family", "Campus"]).ok).toBe(true);
  });
});

describe("evaluateCreateDiscipleshipGroup", () => {
  test("allows another group below the limit", () => {
    expect(
      evaluateCreateDiscipleshipGroup({
        openGroupCount: DISCIPLESHIP_GROUPS_LED_MAX - 1,
        hasPausedGroup: false,
      }),
    ).toEqual({ ok: true });
  });

  test("blocks at the limit on groups led", () => {
    expect(
      evaluateCreateDiscipleshipGroup({
        openGroupCount: DISCIPLESHIP_GROUPS_LED_MAX,
        hasPausedGroup: false,
      }),
    ).toEqual({ ok: false, reason: "limit" });
  });

  test("blocks while any group is paused, so a pause cannot be sidestepped", () => {
    expect(evaluateCreateDiscipleshipGroup({ openGroupCount: 1, hasPausedGroup: true })).toEqual({
      ok: false,
      reason: "paused",
    });
  });
});

describe("evaluateCloseDiscipleshipGroup", () => {
  test("allows closing one of several active groups", () => {
    expect(evaluateCloseDiscipleshipGroup({ status: "active", openGroupCount: 2 })).toEqual({
      ok: true,
    });
  });

  test("keeps the last group open", () => {
    expect(evaluateCloseDiscipleshipGroup({ status: "active", openGroupCount: 1 })).toEqual({
      ok: false,
      reason: "last_group",
    });
  });

  test("leaves a paused or already closed group alone", () => {
    expect(evaluateCloseDiscipleshipGroup({ status: "archived", openGroupCount: 3 })).toEqual({
      ok: false,
      reason: "paused",
    });
    expect(evaluateCloseDiscipleshipGroup({ status: "closed", openGroupCount: 3 }).ok).toBe(false);
  });
});

describe("evaluateDiscipleshipJoin", () => {
  const base = {
    viewerEnrollmentId: 2,
    group: { leaderEnrollmentId: 1, status: "active" as const },
    viewerActiveGroupId: null,
    leaderIsViewersDisciple: false,
    activeMemberCount: 3,
  };

  test("allows a fresh learner to join", () => {
    expect(evaluateDiscipleshipJoin(base)).toEqual({ ok: true });
  });

  test("blocks an archived group", () => {
    expect(
      evaluateDiscipleshipJoin({ ...base, group: { ...base.group, status: "archived" } }),
    ).toEqual({ ok: false, reason: "archived" });
  });

  test("blocks a group its leader has closed", () => {
    expect(
      evaluateDiscipleshipJoin({ ...base, group: { ...base.group, status: "closed" } }),
    ).toEqual({ ok: false, reason: "archived" });
  });

  test("blocks joining your own group", () => {
    expect(evaluateDiscipleshipJoin({ ...base, viewerEnrollmentId: 1 })).toEqual({
      ok: false,
      reason: "own_group",
    });
  });

  test("blocks a second active discipler", () => {
    expect(evaluateDiscipleshipJoin({ ...base, viewerActiveGroupId: 9 })).toEqual({
      ok: false,
      reason: "already_in_group",
    });
  });

  test("blocks joining your own disciple's group", () => {
    expect(evaluateDiscipleshipJoin({ ...base, leaderIsViewersDisciple: true })).toEqual({
      ok: false,
      reason: "circular",
    });
  });

  test("blocks a full group", () => {
    expect(
      evaluateDiscipleshipJoin({ ...base, activeMemberCount: DISCIPLESHIP_GROUP_MAX }),
    ).toEqual({ ok: false, reason: "group_full" });
  });
});

describe("buildWhatsAppUrl", () => {
  test("uses E.164 digits for a stored Nigerian number", () => {
    expect(buildWhatsAppUrl("+2348031234567")).toBe("https://wa.me/2348031234567");
  });

  test("resolves a national number with its country", () => {
    expect(buildWhatsAppUrl("08031234567", "NG")).toBe("https://wa.me/2348031234567");
  });

  test("handles international numbers and prefilled text", () => {
    expect(buildWhatsAppUrl("+447911123456", "GB", "Hello there")).toBe(
      "https://wa.me/447911123456?text=Hello%20there",
    );
  });

  test("returns null for invalid input", () => {
    expect(buildWhatsAppUrl("12345")).toBeNull();
    expect(buildWhatsAppUrl("")).toBeNull();
    expect(buildWhatsAppUrl(null)).toBeNull();
  });
});

describe("shouldAlertStatusChange", () => {
  test("alerts when a disciple slips into a concerning status", () => {
    expect(shouldAlertStatusChange("on_track", "at_risk")).toBe("slipped");
    expect(shouldAlertStatusChange(null, "unresponsive")).toBe("slipped");
  });

  test("stays quiet while already concerning or otherwise unchanged", () => {
    expect(shouldAlertStatusChange("at_risk", "unresponsive")).toBeNull();
    expect(shouldAlertStatusChange("on_track", "declining")).toBeNull();
    expect(shouldAlertStatusChange(null, "on_track")).toBeNull();
  });

  test("celebrates a recovery from a concerning status", () => {
    expect(shouldAlertStatusChange("at_risk", "on_track")).toBe("recovered");
    expect(shouldAlertStatusChange("declining", "on_track")).toBeNull();
  });
});

describe("buildWeeklyDigest", () => {
  test("summarises statuses, answers and prayer requests", () => {
    expect(
      buildWeeklyDigest({
        statuses: ["on_track", "on_track", "declining", "at_risk"],
        unansweredCheckIns: 1,
        openPrayerRequests: 2,
      }),
    ).toEqual({
      title: "Your discipleship week",
      body: "2 on track · 1 slowing down · 1 at risk · 1 check-in answer outstanding · 2 prayer requests",
    });
  });

  test("names the group when the leader runs more than one", () => {
    expect(
      buildWeeklyDigest({
        statuses: ["on_track"],
        unansweredCheckIns: 0,
        openPrayerRequests: 0,
        groupName: "Campus fellowship",
      }),
    ).toEqual({ title: "Your discipleship week", body: "Campus fellowship: 1 on track" });
  });

  test("returns null for an empty group", () => {
    expect(
      buildWeeklyDigest({ statuses: [], unansweredCheckIns: 0, openPrayerRequests: 0 }),
    ).toBeNull();
  });
});

describe("isDigestDay", () => {
  test("uses the Lagos calendar day", () => {
    // Sunday 23:30 UTC is already Monday 00:30 in Lagos.
    expect(isDigestDay(new Date("2026-09-27T23:30:00Z"))).toBe(true);
    expect(isDigestDay(new Date("2026-09-27T12:00:00Z"))).toBe(false);
  });
});

describe("buildCurriculumPromptSuggestions", () => {
  test("uses this week's teachings and level", () => {
    expect(
      buildCurriculumPromptSuggestions({
        levelTitle: "Gospel foundations and the Spirit",
        teachingTitles: ["God's Purpose: Why We Exist", "Gospel: The Word of Truth"],
      }),
    ).toEqual([
      'What stood out to you in "God\'s Purpose: Why We Exist"?',
      'How will you live out "Gospel foundations and the Spirit" this week?',
      'How can I pray for you as you study "Gospel: The Word of Truth"?',
    ]);
  });

  test("falls back to generic questions without teachings", () => {
    expect(buildCurriculumPromptSuggestions({ levelTitle: null, teachingTitles: [] })).toEqual(
      GENERIC_PROMPT_SUGGESTIONS,
    );
  });
});
