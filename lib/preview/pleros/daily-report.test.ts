import { describe, expect, it } from "vitest";

import { emptyDraft, withKind, type ActivityDraft } from "@/lib/community/activity-form";
import { NO_DAY_ACTIVITY } from "@/lib/community/ministry-report";
import { shiftDate } from "@/lib/sogp/daily-date";

import {
  categoryStatus,
  dayReport,
  isWritableDay,
  overallStatus,
  trackerDays,
} from "./daily-report";
import { buildDemoState } from "./fixtures";
import { coverage, scopeIds } from "./scope";
import {
  clearDeclaration,
  confirmDevotional,
  declareNil,
  removeActivity,
  saveActivity,
  updateDevotion,
} from "./store";
import type { DemoState, Outcome } from "./types";

const TODAY = "2026-10-09";
const WORKER = "w-tolu";

function ok(outcome: Outcome): DemoState {
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.state;
}

function evangelism(dateKey: string, patch: Partial<ActivityDraft> = {}): ActivityDraft {
  const draft = withKind(emptyDraft(dateKey), "outreach");
  return {
    ...draft,
    mode: "offline",
    location: "Yaba market",
    numbers: { ...draft.numbers, reachedOffline: "14", saved: "2" },
    ...patch,
  };
}

describe("category status: activity, explicit nil and missing", () => {
  it("leaves prefilled devotion missing until it is confirmed", () => {
    const state = buildDemoState(TODAY);
    const report = dayReport(state, WORKER, TODAY);
    expect(report.devotionLines.filter((line) => line.detail).length).toBeGreaterThan(0);
    expect(report.statuses).toEqual({ devotional: "missing", ministry: "missing", meetings: "missing" });
    expect(report.overall).toBe("not_started");

    const confirmed = ok(confirmDevotional(state, WORKER, TODAY));
    expect(categoryStatus(confirmed, WORKER, TODAY, "devotional")).toBe("activity");
  });

  it("treats a confirmed empty devotion as nil, not activity", () => {
    const state = ok(updateDevotion(buildDemoState(TODAY), WORKER, TODAY, NO_DAY_ACTIVITY));
    expect(categoryStatus(state, WORKER, TODAY, "devotional")).toBe("missing");
    const confirmed = ok(confirmDevotional(state, WORKER, TODAY));
    expect(categoryStatus(confirmed, WORKER, TODAY, "devotional")).toBe("nil");
  });

  it("tells an explicit nil apart from never reporting", () => {
    const state = buildDemoState(TODAY);
    const nil = ok(declareNil(state, WORKER, TODAY, "meetings"));
    expect(categoryStatus(state, WORKER, TODAY, "meetings")).toBe("missing");
    expect(categoryStatus(nil, WORKER, TODAY, "meetings")).toBe("nil");
    expect(dayReport(nil, WORKER, TODAY).numbers).toEqual(dayReport(state, WORKER, TODAY).numbers);
    expect(ok(clearDeclaration(nil, WORKER, TODAY, "meetings")).declarations[WORKER]?.[TODAY]?.meetings).toBeUndefined();
  });

  it("refuses nil while activity exists and clears nil when activity is saved", () => {
    let state = ok(declareNil(buildDemoState(TODAY), WORKER, TODAY, "ministry"));
    state = ok(saveActivity(state, { viewerId: WORKER, draft: evangelism(TODAY) }));
    expect(categoryStatus(state, WORKER, TODAY, "ministry")).toBe("activity");
    expect(state.declarations[WORKER]?.[TODAY]?.ministry).toBeUndefined();
    expect(declareNil(state, WORKER, TODAY, "ministry").ok).toBe(false);
  });

  it("completes the day only when all three categories are reported", () => {
    expect(overallStatus(["activity", "nil", "nil"])).toBe("complete");
    expect(overallStatus(["activity", "missing", "nil"])).toBe("in_progress");
    expect(overallStatus(["missing", "missing", "missing"])).toBe("not_started");

    let state = buildDemoState(TODAY);
    state = ok(confirmDevotional(state, WORKER, TODAY));
    state = ok(saveActivity(state, { viewerId: WORKER, draft: evangelism(TODAY) }));
    expect(dayReport(state, WORKER, TODAY).overall).toBe("in_progress");
    state = ok(declareNil(state, WORKER, TODAY, "meetings"));
    expect(dayReport(state, WORKER, TODAY).overall).toBe("complete");
  });

  it("does not count a removed activity as reported", () => {
    let state = ok(saveActivity(buildDemoState(TODAY), { viewerId: WORKER, draft: evangelism(TODAY) }));
    const saved = state.activities.at(-1)!;
    state = ok(removeActivity(state, WORKER, saved.id));
    expect(categoryStatus(state, WORKER, TODAY, "ministry")).toBe("missing");
  });
});

describe("the late window", () => {
  it("allows today and the previous seven Lagos days", () => {
    expect(isWritableDay(TODAY, TODAY)).toBe(true);
    expect(isWritableDay(shiftDate(TODAY, -7), TODAY)).toBe(true);
    expect(isWritableDay(shiftDate(TODAY, -8), TODAY)).toBe(false);
    expect(isWritableDay(shiftDate(TODAY, 1), TODAY)).toBe(false);
  });

  it("refuses every write to an older day", () => {
    const state = buildDemoState(TODAY);
    const old = shiftDate(TODAY, -8);
    expect(saveActivity(state, { viewerId: WORKER, draft: evangelism(old) }).ok).toBe(false);
    expect(declareNil(state, WORKER, old, "meetings").ok).toBe(false);
    expect(confirmDevotional(state, WORKER, old).ok).toBe(false);
    expect(updateDevotion(state, WORKER, old, NO_DAY_ACTIVITY).ok).toBe(false);
    const oldActivity = { ...state.activities[0], id: 99999, personId: WORKER, activityDate: old };
    const withOldActivity = { ...state, activities: [...state.activities, oldActivity] };
    expect(removeActivity(withOldActivity, WORKER, oldActivity.id).ok).toBe(false);
  });

  it("builds a seven-day tracker ending on the chosen day", () => {
    const days = trackerDays(TODAY);
    expect(days).toHaveLength(7);
    expect(days.at(-1)).toBe(TODAY);
    expect(days[0]).toBe(shiftDate(TODAY, -6));
  });
});

describe("shared report state", () => {
  it("updates the unit and every level above as soon as the worker reports", () => {
    let state = buildDemoState(TODAY);
    const before = {
      unit: coverage(state, scopeIds(state, "u-chioma"), TODAY).overall.complete,
      pastorate: coverage(state, scopeIds(state, "p-kunle"), TODAY).overall.complete,
      pastor: coverage(state, scopeIds(state, "p-ife"), TODAY).overall.complete,
    };
    state = ok(confirmDevotional(state, WORKER, TODAY));
    state = ok(saveActivity(state, { viewerId: WORKER, draft: evangelism(TODAY) }));
    state = ok(declareNil(state, WORKER, TODAY, "meetings"));

    expect(coverage(state, scopeIds(state, "u-chioma"), TODAY).overall.complete).toBe(before.unit + 1);
    expect(coverage(state, scopeIds(state, "p-kunle"), TODAY).overall.complete).toBe(before.pastorate + 1);
    expect(coverage(state, scopeIds(state, "p-ife"), TODAY).overall.complete).toBe(before.pastor + 1);
    // Another branch is untouched.
    const other = buildDemoState(TODAY);
    expect(coverage(state, scopeIds(state, "p-ngozi"), TODAY)).toEqual(
      coverage(other, scopeIds(other, "p-ngozi"), TODAY),
    );
  });
});
