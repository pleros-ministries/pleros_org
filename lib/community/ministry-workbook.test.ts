import * as XLSX from "xlsx";
import { describe, expect, test } from "vitest";

import {
  buildMinistryDayWorkbook,
  buildMinistryRangeWorkbook,
  type WorkbookActivity,
} from "./ministry-workbook";
import { NO_DAY_ACTIVITY, emptyMinistryNumbers } from "./ministry-report";

const outreach: WorkbookActivity = {
  ...emptyMinistryNumbers(),
  activityDate: "2026-10-05",
  kind: "outreach",
  title: null,
  mode: "online",
  platform: "other:Zoom",
  location: null,
  note: "Evening call.",
  peopleCount: 2,
  reachedOnline: 12,
  saved: 1,
};

const meeting: WorkbookActivity = {
  ...emptyMinistryNumbers(),
  activityDate: "2026-10-05",
  kind: "teaching_meeting",
  title: "Youth fellowship",
  mode: null,
  platform: null,
  location: "Church hall",
  note: null,
  peopleCount: 0,
  attendance: 40,
};

function sheetRows(buffer: Buffer, name: string): Array<Record<string, unknown>> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[name];
  expect(sheet).toBeDefined();
  return XLSX.utils.sheet_to_json(sheet);
}

describe("buildMinistryDayWorkbook", () => {
  const buffer = buildMinistryDayWorkbook(
    [
      {
        name: "Ada",
        unitName: "Lagos",
        activities: [outreach, meeting],
        totals: { ...emptyMinistryNumbers(), reachedOnline: 12, attendance: 40, saved: 1 },
        activity: NO_DAY_ACTIVITY,
      },
      { name: "Bola", unitName: null, activities: [], totals: null, activity: NO_DAY_ACTIVITY },
    ],
    "2026-10-05",
  );

  test("has a sheet per member, per activity and the totals", () => {
    expect(XLSX.read(buffer, { type: "buffer" }).SheetNames).toEqual([
      "Members",
      "Activities",
      "Totals",
    ]);
  });

  test("lists each activity with where it happened", () => {
    const rows = sheetRows(buffer, "Activities");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      Name: "Ada",
      Activity: "Outreach",
      Mode: "Online",
      Platform: "Zoom",
      "People reached online": 12,
      People: 2,
      Note: "Evening call.",
    });
    expect(rows[1]).toMatchObject({
      Activity: "Teaching meeting",
      Title: "Youth fellowship",
      Location: "Church hall",
      "People present": 40,
    });
  });

  test("totals count members reporting and each kind", () => {
    const [totals] = sheetRows(buffer, "Totals");
    expect(totals).toMatchObject({
      Members: 2,
      "Members reporting": 1,
      Activities: 2,
      Outreach: 1,
      "Teaching meeting": 1,
      "Prayer meeting": 0,
    });
    const [ada] = sheetRows(buffer, "Members");
    expect(ada).toMatchObject({ Name: "Ada", Activities: 2, Notes: "Evening call." });
  });
});

describe("buildMinistryRangeWorkbook", () => {
  const byKind = {
    outreach: 1,
    teaching_meeting: 1,
    prayer_meeting: 0,
    follow_up: 0,
    church_service: 0,
    other: 0,
  };
  const buffer = buildMinistryRangeWorkbook({
    fromKey: "2026-10-01",
    toKey: "2026-10-05",
    byMember: [
      {
        ...emptyMinistryNumbers(),
        name: "Ada",
        unitName: "Lagos",
        days: 1,
        activities: 2,
        byKind,
        reachedOnline: 12,
        attendance: 40,
      },
    ],
    byDay: [
      {
        ...emptyMinistryNumbers(),
        dateKey: "2026-10-05",
        members: 1,
        activities: 2,
        byKind,
        reachedOnline: 12,
        attendance: 40,
      },
    ],
    activities: [
      { ...outreach, memberName: "Ada", unitName: "Lagos" },
      { ...meeting, memberName: "Ada", unitName: "Lagos" },
    ],
    contacts: [
      {
        metDate: "2026-10-05",
        memberName: "Ada",
        name: "Chidi",
        phone: "0803 555 0101",
        note: null,
        salvationStatus: "saved",
        discipleshipStatus: "following_up",
        followUpPlan: "Invite on Sunday",
        nextFollowUpDate: "2026-10-12",
        interactionCount: 2,
        lastInteractionDate: "2026-10-06",
        lastInteractionKind: "call",
        followedUpAt: "2026-10-06T09:00:00.000Z",
        followedUpByName: "Ada",
      },
    ],
    interactions: [
      {
        interactionDate: "2026-10-06",
        kind: "call",
        outcomes: { saved: false, filled: true, healed: false },
        note: "Prayed together",
        contactName: "Chidi",
        contactPhone: "0803 555 0101",
        memberName: "Ada",
        loggedByName: "Ada",
      },
    ],
  });

  test("has five sheets", () => {
    expect(XLSX.read(buffer, { type: "buffer" }).SheetNames).toEqual([
      "By member",
      "By day",
      "Activities",
      "People met",
      "Interactions",
    ]);
  });

  test("totals count people present as reached", () => {
    const [member] = sheetRows(buffer, "By member");
    expect(member).toMatchObject({ Name: "Ada", Days: 1, Activities: 2, "Total reached": 52 });
    const [day] = sheetRows(buffer, "By day");
    expect(day).toMatchObject({ Date: "2026-10-05", Members: 1, Outreach: 1 });
  });

  test("carries each person's statuses and every interaction", () => {
    const [person] = sheetRows(buffer, "People met");
    expect(person).toMatchObject({
      Name: "Chidi",
      Salvation: "Gave their life to Christ",
      Discipleship: "Being followed up",
      "Follow-up plan": "Invite on Sunday",
      "Next follow-up": "2026-10-12",
      Interactions: 2,
      "Last interaction": "2026-10-06 (Call)",
      "Followed up": "2026-10-06",
    });
    const [touch] = sheetRows(buffer, "Interactions");
    expect(touch).toMatchObject({
      Person: "Chidi",
      Kind: "Call",
      Saved: "No",
      Filled: "Yes",
      Note: "Prayed together",
    });
  });
});
