import { describe, expect, it } from "vitest";
import { dailyCategoryStatus, normaliseMeetingDetails, validateDailyDeclaration } from "./daily-report";

const date = "2026-10-09";
describe("daily reporting declarations", () => {
  it("does not turn prefilled devotion into a submission without confirmation", () => {
    expect(dailyCategoryStatus({ category: "devotional", declaration: null, activityCount: 0, hasDevotionalActivity: true })).toBe("missing");
    expect(dailyCategoryStatus({ category: "devotional", declaration: "confirmed", activityCount: 0, hasDevotionalActivity: true })).toBe("reported");
    expect(dailyCategoryStatus({ category: "devotional", declaration: "confirmed", activityCount: 0, hasDevotionalActivity: false })).toBe("nil");
  });
  it("distinguishes explicit Nil from missing and prefers actual recorded activity", () => {
    expect(dailyCategoryStatus({ category: "meetings", declaration: null, activityCount: 0, hasDevotionalActivity: false })).toBe("missing");
    expect(dailyCategoryStatus({ category: "meetings", declaration: "nil", activityCount: 0, hasDevotionalActivity: false })).toBe("nil");
    expect(dailyCategoryStatus({ category: "meetings", declaration: "nil", activityCount: 1, hasDevotionalActivity: false })).toBe("reported");
    expect(validateDailyDeclaration({ date, today: date, category: "meetings", declaration: "nil", categoryActivityCount: 1 })).toMatch(/already exists/);
  });
  it("accepts only the chosen category declaration within the seven-day write window", () => {
    expect(validateDailyDeclaration({ date: "2026-10-02", today: date, category: "ministry", declaration: "nil", categoryActivityCount: 0 })).toBeNull();
    expect(validateDailyDeclaration({ date: "2026-10-01", today: date, category: "ministry", declaration: "nil", categoryActivityCount: 0 })).not.toBeNull();
    expect(validateDailyDeclaration({ date, today: date, category: "devotional", declaration: "nil", categoryActivityCount: 0 })).not.toBeNull();
  });
});
describe("meeting reporting roles", () => {
  it("requires the leader's teaching and strips it from other reporting roles", () => {
    expect(normaliseMeetingDetails({ kind: "teaching_meeting", role: "leader", taught: "", attendance: 12 }).ok).toBe(false);
    expect(normaliseMeetingDetails({ kind: "prayer_meeting", role: "worker", taught: "Private extra", attendance: 4 })).toEqual({ ok: true, value: { role: "worker", taught: null } });
  });
  it("records Member attendance as one person, never the whole meeting", () => {
    expect(normaliseMeetingDetails({ kind: "teaching_meeting", role: "member", taught: "", attendance: 12 }).ok).toBe(false);
    expect(normaliseMeetingDetails({ kind: "teaching_meeting", role: "member", taught: "", attendance: 1 })).toEqual({ ok: true, value: { role: "member", taught: null } });
    expect(normaliseMeetingDetails({ kind: "church_service", role: "leader", taught: "Word", attendance: 12 }).ok).toBe(false);
  });
});
