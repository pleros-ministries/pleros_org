import { describe, expect, test } from "vitest";

import {
  activityKeyNumbers,
  activityTitle,
  canJumpTo,
  draftFromActivity,
  emptyDraft,
  fieldId,
  firstErrorId,
  prefillFromFollowUps,
  savedMismatch,
  stepsFor,
  toSaveInput,
  validateStep,
  withKind,
  type ActivityDraft,
  type SavedActivity,
} from "./activity-form";
import { emptyMinistryNumbers } from "./ministry-report";

const day = "2026-10-05";

function outreachDraft(overrides: Partial<ActivityDraft> = {}): ActivityDraft {
  return {
    ...withKind(emptyDraft(day), "outreach"),
    mode: "both",
    platform: "whatsapp",
    location: "Ikeja market",
    ...overrides,
  };
}

describe("stepsFor", () => {
  test("gives each kind its steps, with people before numbers for a follow-up", () => {
    expect(stepsFor(null)).toEqual(["kind"]);
    expect(stepsFor("outreach")).toEqual(["kind", "where", "numbers", "people", "review"]);
    expect(stepsFor("teaching_meeting")).toEqual(["kind", "where", "numbers", "review"]);
    expect(stepsFor("prayer_meeting")).toEqual(["kind", "where", "numbers", "review"]);
    // An older church service still opens with its steps when corrected.
    expect(stepsFor("church_service")).toEqual(["kind", "where", "numbers", "review"]);
    expect(stepsFor("follow_up")).toEqual(["kind", "people", "numbers", "review"]);
  });
});

describe("validateStep", () => {
  test("a kind must be chosen first", () => {
    expect(validateStep("kind", emptyDraft(day))).toEqual({ kind: "Choose what you did." });
    expect(validateStep("kind", outreachDraft())).toEqual({});
  });

  test("an outreach needs a mode, then a platform online and a place offline", () => {
    expect(validateStep("where", outreachDraft({ mode: null }))).toEqual({
      mode: "Choose online, offline or both.",
    });
    expect(validateStep("where", outreachDraft({ mode: "online", platform: "" }))).toEqual({
      platform: "Choose the platform.",
    });
    expect(
      validateStep("where", outreachDraft({ mode: "online", platform: "other" })),
    ).toEqual({ platformOther: "Say which platform." });
    expect(validateStep("where", outreachDraft({ mode: "offline", location: " " }))).toEqual({
      location: "Enter where you were.",
    });
    expect(validateStep("where", outreachDraft({ platform: "", location: "" }))).toEqual({
      platform: "Choose the platform.",
      location: "Enter where you were.",
    });
    expect(validateStep("where", outreachDraft())).toEqual({});
  });

  test("an older something-else activity needs a name; a meeting does not", () => {
    expect(validateStep("where", withKind(emptyDraft(day), "other"))).toEqual({
      title: "Give this activity a short name.",
    });
    expect(validateStep("where", withKind(emptyDraft(day), "prayer_meeting"))).toEqual({});
  });

  test("required numbers are named, and only whole numbers pass", () => {
    const draft = outreachDraft();
    expect(validateStep("numbers", draft)).toEqual({
      "numbers.reachedOnline":
        'Enter a number for "People reached online". Use 0 if there were none.',
      "numbers.reachedOffline":
        'Enter a number for "People reached offline". Use 0 if there were none.',
    });
    const typed = outreachDraft({
      numbers: { ...draft.numbers, reachedOnline: "12", reachedOffline: "0", saved: "two" },
    });
    expect(validateStep("numbers", typed)).toEqual({
      "numbers.saved": '"Gave their lives to Christ" must be a whole number from 0 to 100,000.',
    });
    expect(firstErrorId(validateStep("numbers", typed))).toBe("activity-numbers.saved");
    expect(fieldId("mode")).toBe("activity-mode");
  });

  test("people rows are checked only when filled in, and name their row", () => {
    const draft = outreachDraft({
      people: [
        { ...blankPersonLike("a"), name: "" },
        { ...blankPersonLike("b"), name: "Ada", phone: "12" },
      ],
    });
    expect(validateStep("people", draft)).toEqual({
      "people.b": "Enter a valid phone number, or leave it blank.",
    });
  });

  test("a long note is refused at review", () => {
    expect(validateStep("review", outreachDraft({ note: "x".repeat(501) }))).toEqual({
      note: "Keep the note under 500 characters.",
    });
    expect(validateStep("review", outreachDraft())).toEqual({});
  });

  test("jumping ahead needs every earlier step to pass", () => {
    const steps = stepsFor("outreach");
    expect(canJumpTo(steps, 1, outreachDraft())).toBe(true);
    expect(canJumpTo(steps, 2, outreachDraft({ mode: null }))).toBe(false);
    expect(canJumpTo(steps, 0, emptyDraft(day))).toBe(true);
  });
});

function blankPersonLike(key: string) {
  return {
    key,
    id: null,
    name: "",
    phone: "",
    note: "",
    saved: false,
    filled: false,
    healed: false,
    wantsFollowUp: false,
  };
}

describe("reading a saved activity in and out", () => {
  const saved: SavedActivity = {
    ...emptyMinistryNumbers(),
    reachedOnline: 12,
    reachedOffline: 3,
    saved: 2,
    attendance: 99,
    activityDate: day,
    kind: "outreach",
    title: null,
    mode: "both",
    platform: "other:Zoom",
    location: "Ikeja market",
    note: "Good day.",
    people: [
      {
        id: 7,
        name: "Ada",
        phone: "0803 555 0101",
        note: null,
        outcomes: { saved: true, filled: false, healed: false },
        discipleshipStatus: "following_up",
      },
    ],
    followUpPeople: [],
  };

  test("round-trips an outreach with its people", () => {
    const draft = draftFromActivity(saved);
    expect(draft.platform).toBe("other");
    expect(draft.platformOther).toBe("Zoom");
    expect(draft.numbers.reachedOnline).toBe("12");
    // A number the kind does not show stays blank, so it is not sent back.
    expect(draft.numbers.attendance).toBe("");
    expect(draft.people).toEqual([
      {
        key: "saved-7",
        id: 7,
        name: "Ada",
        phone: "0803 555 0101",
        note: "",
        saved: true,
        filled: false,
        healed: false,
        wantsFollowUp: true,
      },
    ]);

    const input = toSaveInput(draft, 42);
    expect(input.activityId).toBe(42);
    expect(input.kind).toBe("outreach");
    expect(input.platform).toBe("other");
    expect(input.platformOther).toBe("Zoom");
    expect(input.values).toEqual({
      reachedOnline: "12",
      reachedOffline: "3",
      saved: "2",
      notSaved: "0",
      filled: "0",
      healed: "0",
      followUps: "0",
    });
    expect(input.people[0]).toMatchObject({ id: 7, name: "Ada", saved: true, wantsFollowUp: true });
    expect(input.followUps).toEqual([]);
  });

  test("round-trips a follow-up with its picks", () => {
    const draft = draftFromActivity({
      ...saved,
      kind: "follow_up",
      mode: null,
      platform: null,
      location: null,
      followUps: 2,
      followUpPeople: [
        {
          contactId: 7,
          name: "Ada",
          phone: null,
          kind: "call",
          outcomes: { saved: false, filled: true, healed: false },
          note: "Prayed",
        },
        {
          contactId: 8,
          name: "Chidi",
          phone: null,
          kind: "follow_up",
          outcomes: { saved: false, filled: false, healed: false },
          note: null,
        },
      ],
      people: [],
    });
    expect(draft.followUps.map((row) => row.kind)).toEqual(["call", "other"]);
    // The count of follow-ups made is a number of its own, not the list of people.
    expect(draft.numbers.followUps).toBe("2");
    expect(toSaveInput(draft).followUps).toEqual([
      { contactId: 7, kind: "call", saved: false, filled: true, healed: false, note: "Prayed" },
      { contactId: 8, kind: "other", saved: false, filled: false, healed: false, note: "" },
    ]);
  });
});

describe("help between steps", () => {
  test("a follow-up's numbers are filled from its picks, but typed numbers stay", () => {
    const draft: ActivityDraft = {
      ...withKind(emptyDraft(day), "follow_up"),
      followUps: [
        { contactId: 1, name: "Ada", phone: null, kind: "call", saved: true, filled: true, healed: false, note: "" },
        { contactId: 2, name: "Bola", phone: null, kind: "visit", saved: false, filled: false, healed: false, note: "" },
      ],
    };
    const filled = prefillFromFollowUps(draft);
    expect(filled.numbers.followUps).toBe("2");
    expect(filled.numbers.saved).toBe("1");
    expect(filled.numbers.filled).toBe("1");
    expect(filled.numbers.healed).toBe("");
    const typed = prefillFromFollowUps({ ...draft, numbers: { ...draft.numbers, followUps: "5" } });
    expect(typed.numbers.followUps).toBe("5");
    expect(prefillFromFollowUps(outreachDraft()).numbers.followUps).toBe("");
  });

  test("warns when more people are ticked saved than were counted", () => {
    const draft = outreachDraft({
      numbers: { ...outreachDraft().numbers, saved: "1" },
      people: [
        { ...blankPersonLike("a"), name: "Ada", saved: true },
        { ...blankPersonLike("b"), name: "Bola", saved: true },
      ],
    });
    expect(savedMismatch(draft)).toBe(
      "2 people are marked Saved but you entered 1. Go back to the numbers to correct it.",
    );
    expect(savedMismatch({ ...draft, numbers: { ...draft.numbers, saved: "2" } })).toBeNull();
    expect(savedMismatch({ ...draft, numbers: { ...draft.numbers, saved: "" }, people: [] })).toBeNull();
  });
});

describe("describing an activity", () => {
  test("titles and key numbers read naturally", () => {
    expect(activityTitle({ kind: "outreach", title: null })).toBe("Evangelism");
    expect(activityTitle({ kind: "teaching_meeting", title: "Youth fellowship" })).toBe(
      "Teaching meeting · Youth fellowship",
    );
    expect(
      activityKeyNumbers({
        ...emptyMinistryNumbers(),
        kind: "outreach",
        reachedOnline: 10,
        reachedOffline: 2,
        saved: 3,
        followUps: 2,
      }),
    ).toBe("12 reached · 3 saved · 2 follow-ups");
    expect(
      activityKeyNumbers({ ...emptyMinistryNumbers(), kind: "prayer_meeting", attendance: 40, saved: 2 }),
    ).toBe("40 present · 2 saved");
    expect(
      activityKeyNumbers({ ...emptyMinistryNumbers(), kind: "follow_up", followUps: 1, healed: 1 }),
    ).toBe("1 follow-up · 1 healed");
    expect(activityTitle({ kind: "follow_up", title: null })).toBe("Discipleship");
  });
});
