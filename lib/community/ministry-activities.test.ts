import { describe, expect, test } from "vitest";

import {
  ACTIVITIES_PER_DAY_MAX,
  ACTIVITY_KINDS,
  ALL_ACTIVITY_KINDS,
  activityKindLabel,
  ACTIVITY_PLACE_MAX,
  ACTIVITY_TITLE_MAX,
  activityFields,
  activitySummary,
  activityWhere,
  groupActivitiesByDay,
  normaliseActivityInput,
  parsePlatform,
  platformLabel,
} from "./ministry-activities";
import { MINISTRY_NOTE_MAX, emptyMinistryNumbers } from "./ministry-report";

describe("activityFields", () => {
  test("outreach asks for the reached numbers its mode needs", () => {
    expect(activityFields("outreach", "online")).toEqual({
      shown: ["reachedOnline", "saved", "notSaved", "filled", "healed", "followUps"],
      required: ["reachedOnline"],
    });
    expect(activityFields("outreach", "offline").required).toEqual(["reachedOffline"]);
    expect(activityFields("outreach", "both").required).toEqual([
      "reachedOnline",
      "reachedOffline",
    ]);
    expect(activityFields("outreach", null).required).toEqual([]);
  });

  test("meetings need the people present; follow-ups and other need nothing", () => {
    for (const kind of ["teaching_meeting", "prayer_meeting"] as const) {
      expect(activityFields(kind, null)).toEqual({
        shown: ["attendance", "saved", "filled", "healed"],
        required: ["attendance"],
      });
    }
    expect(activityFields("follow_up", null)).toEqual({
      shown: ["followUps", "saved", "filled", "healed"],
      required: [],
    });
    expect(activityFields("other", null).required).toEqual([]);
  });

  test("the form offers evangelism, discipleship, then the two meetings", () => {
    expect(ACTIVITY_KINDS.map((kind) => kind.key)).toEqual([
      "outreach",
      "follow_up",
      "teaching_meeting",
      "prayer_meeting",
    ]);
    expect(ACTIVITY_KINDS.map((kind) => kind.label)).toEqual([
      "Evangelism",
      "Discipleship",
      "Teaching meeting",
      "Prayer meeting",
    ]);
    expect(activityKindLabel("outreach")).toBe("Evangelism");
    expect(activityKindLabel("follow_up")).toBe("Discipleship");
  });

  test("church service and something else are kept only for older activities", () => {
    expect(ALL_ACTIVITY_KINDS.filter((kind) => !kind.offered).map((kind) => kind.key)).toEqual([
      "church_service",
      "other",
    ]);
    // Older activities still read and add up.
    expect(activityKindLabel("church_service")).toBe("Church service");
    expect(activityFields("church_service", null).required).toEqual(["attendance"]);
  });

  test("every stored kind is listed once with a label and a hint", () => {
    const keys = ALL_ACTIVITY_KINDS.map((kind) => kind.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(ALL_ACTIVITY_KINDS.every((kind) => kind.label && kind.hint)).toBe(true);
    expect(ALL_ACTIVITY_KINDS.find((kind) => kind.key === "other")?.titleRequired).toBe(true);
    expect(ACTIVITY_KINDS.find((kind) => kind.key === "outreach")?.people).toBe("met");
    expect(ACTIVITY_KINDS.find((kind) => kind.key === "follow_up")?.people).toBe(
      "follow_up",
    );
  });
});

describe("normaliseActivityInput", () => {
  test("reads an outreach that was online and offline", () => {
    expect(
      normaliseActivityInput({
        kind: "outreach",
        mode: "both",
        platform: "whatsapp",
        location: " Ikeja  market ",
        values: { reachedOnline: "12", reachedOffline: "3", saved: "2" },
        note: " Good day. ",
      }),
    ).toEqual({
      ok: true,
      value: {
        ...emptyMinistryNumbers(),
        reachedOnline: 12,
        reachedOffline: 3,
        saved: 2,
        kind: "outreach",
        title: null,
        mode: "both",
        platform: "whatsapp",
        location: "Ikeja market",
        note: "Good day.",
      },
    });
  });

  test("an unknown kind is refused", () => {
    expect(normaliseActivityInput({ kind: "picnic" })).toEqual({
      ok: false,
      error: "Choose what you did.",
    });
    expect(normaliseActivityInput({}).ok).toBe(false);
  });

  test("outreach needs a mode, then a platform online and a place offline", () => {
    expect(normaliseActivityInput({ kind: "outreach", values: {} })).toEqual({
      ok: false,
      error: "Choose online, offline or both.",
    });
    expect(
      normaliseActivityInput({ kind: "outreach", mode: "online", values: { reachedOnline: "1" } }),
    ).toEqual({ ok: false, error: "Choose the platform." });
    expect(
      normaliseActivityInput({
        kind: "outreach",
        mode: "offline",
        values: { reachedOffline: "1" },
      }),
    ).toEqual({ ok: false, error: "Enter where you were." });
    expect(
      normaliseActivityInput({
        kind: "outreach",
        mode: "online",
        platform: "other",
        values: { reachedOnline: "1" },
      }),
    ).toEqual({ ok: false, error: "Say which platform." });
    expect(
      normaliseActivityInput({
        kind: "outreach",
        mode: "online",
        platform: "carrier pigeon",
        values: { reachedOnline: "1" },
      }),
    ).toEqual({ ok: false, error: "Choose the platform." });
  });

  test("an other platform keeps its name, and the mode decides which reached numbers are read", () => {
    const parsed = normaliseActivityInput({
      kind: "outreach",
      mode: "online",
      platform: "other",
      platformOther: " Zoom ",
      location: "ignored when online",
      values: { reachedOnline: "4", reachedOffline: "99" },
    });
    expect(parsed.ok && parsed.value.platform).toBe("other:Zoom");
    expect(parsed.ok && parsed.value.reachedOffline).toBe(0);
    expect(parsed.ok && parsed.value.location).toBeNull();
  });

  test("a required number left blank names the field", () => {
    expect(
      normaliseActivityInput({
        kind: "outreach",
        mode: "online",
        platform: "whatsapp",
        values: {},
      }),
    ).toEqual({
      ok: false,
      error: 'Enter a number for "People reached online". Use 0 if there were none.',
    });
    expect(normaliseActivityInput({ kind: "teaching_meeting", values: {} })).toEqual({
      ok: false,
      error: 'Enter a number for "People present". Use 0 if there were none.',
    });
  });

  test("a meeting keeps its name and place and drops outreach fields", () => {
    expect(
      normaliseActivityInput({
        kind: "prayer_meeting",
        title: " Tuesday  prayers ",
        location: "Church hall",
        mode: "online",
        platform: "whatsapp",
        values: { attendance: "40", reachedOnline: "7" },
      }),
    ).toEqual({
      ok: true,
      value: {
        ...emptyMinistryNumbers(),
        attendance: 40,
        kind: "prayer_meeting",
        title: "Tuesday prayers",
        mode: null,
        platform: null,
        location: "Church hall",
        note: null,
      },
    });
  });

  test("church service and something else can be corrected but never added", () => {
    for (const kind of ["church_service", "other"]) {
      expect(normaliseActivityInput({ kind, title: "Visit", values: { attendance: "4" } })).toEqual({
        ok: false,
        error: "Choose what you did.",
      });
    }
    const corrected = normaliseActivityInput({
      kind: "church_service",
      values: { attendance: "120" },
      allowRetired: true,
    });
    expect(corrected.ok && corrected.value.attendance).toBe(120);
  });

  test("an older something-else activity still needs its name; discipleship ignores one", () => {
    expect(normaliseActivityInput({ kind: "other", values: {}, allowRetired: true })).toEqual({
      ok: false,
      error: "Give this activity a short name.",
    });
    const parsed = normaliseActivityInput({
      kind: "follow_up",
      title: "ignored",
      values: { followUps: "2" },
    });
    expect(parsed.ok && parsed.value.title).toBeNull();
    expect(parsed.ok && parsed.value.location).toBeNull();
  });

  test("a follow-up defaults its count to the people sent, unless typed", () => {
    const blank = normaliseActivityInput({ kind: "follow_up", values: {}, peopleCount: 3 });
    expect(blank.ok && blank.value.followUps).toBe(3);
    const typed = normaliseActivityInput({
      kind: "follow_up",
      values: { followUps: "5" },
      peopleCount: 3,
    });
    expect(typed.ok && typed.value.followUps).toBe(5);
    const none = normaliseActivityInput({ kind: "follow_up", values: {} });
    expect(none.ok && none.value.followUps).toBe(0);
  });

  test("long names, places and notes are refused", () => {
    const meeting = { kind: "teaching_meeting", values: { attendance: "10" } };
    expect(
      normaliseActivityInput({ ...meeting, title: "x".repeat(ACTIVITY_TITLE_MAX + 1) }).ok,
    ).toBe(false);
    expect(
      normaliseActivityInput({ ...meeting, location: "x".repeat(ACTIVITY_PLACE_MAX + 1) }).ok,
    ).toBe(false);
    expect(
      normaliseActivityInput({ ...meeting, note: "x".repeat(MINISTRY_NOTE_MAX + 1) }).ok,
    ).toBe(false);
    expect(normaliseActivityInput(meeting).ok).toBe(true);
  });
});

describe("platforms and summaries", () => {
  test("reads stored platforms back", () => {
    expect(parsePlatform("whatsapp")).toEqual({ key: "whatsapp", detail: null });
    expect(parsePlatform("other:Zoom")).toEqual({ key: "other", detail: "Zoom" });
    expect(parsePlatform("retired_key")).toEqual({ key: "other", detail: "retired_key" });
    expect(parsePlatform(null)).toBeNull();
    expect(platformLabel("x")).toBe("X (Twitter)");
    expect(platformLabel("other:Zoom")).toBe("Zoom");
    expect(platformLabel(null)).toBeNull();
  });

  test("describes where an activity happened", () => {
    expect(
      activityWhere({ mode: "both", platform: "whatsapp", location: "Ikeja market" }),
    ).toBe("Online and offline · WhatsApp · Ikeja market");
    expect(activityWhere({ mode: "online", platform: "other:Zoom", location: null })).toBe(
      "Online · Zoom",
    );
    expect(activityWhere({ mode: null, platform: null, location: "Church hall" })).toBe(
      "Church hall",
    );
    expect(activityWhere({ mode: null, platform: null, location: null })).toBeNull();
  });

  test("summarises an activity in one line", () => {
    expect(
      activitySummary({
        kind: "teaching_meeting",
        title: "Youth fellowship",
        mode: null,
        platform: null,
        location: null,
      }),
    ).toBe("Teaching meeting · Youth fellowship");
    expect(
      activitySummary({
        kind: "outreach",
        title: null,
        mode: "offline",
        platform: null,
        location: "Ikeja",
      }),
    ).toBe("Evangelism · Offline · Ikeja");
  });

  test("groups activities by day in the order given", () => {
    const grouped = groupActivitiesByDay([
      { id: 1, activityDate: "2026-10-05" },
      { id: 2, activityDate: "2026-10-04" },
      { id: 3, activityDate: "2026-10-05" },
    ]);
    expect([...grouped.keys()]).toEqual(["2026-10-05", "2026-10-04"]);
    expect(grouped.get("2026-10-05")?.map((row) => row.id)).toEqual([1, 3]);
  });

  test("a day holds a small number of activities", () => {
    expect(ACTIVITIES_PER_DAY_MAX).toBe(10);
  });
});
