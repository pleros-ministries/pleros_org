import { describe, expect, it } from "vitest";
import { parseReportContacts, parseSharedMeeting, parseMinistryReport } from "./reporting-v3-input";

describe("live reporting input", () => {
  it("refuses draft, repeated or malformed contact keys", () => {
    expect(() => parseReportContacts(["random-draft"])).toThrow();
    expect(() => parseReportContacts(["private:1", "private:1"])).toThrow();
    expect(() => parseReportContacts(["legacy:0"])).toThrow();
    expect(parseReportContacts(["private:1", "legacy:2"])).toEqual(["private:1", "legacy:2"]);
  });
  it("maps canonical offline/online/both fields without adding named people", () => {
    const base = { kind: "outreach", peopleCount: 5, contacts: [], outcomes: {}, context: "Yaba", note: "", method: "In person" };
    expect(parseMinistryReport(base).activity.reachedOffline).toBe(5);
    expect(parseMinistryReport({ ...base, method: "Online", platform: "whatsapp" }).activity.reachedOnline).toBe(5);
    const both = parseMinistryReport({ ...base, method: "Both", platform: "whatsapp", onlineCount: "2", offlineCount: "3" });
    expect(both.activity.reachedOnline).toBe(2);
    expect(both.activity.reachedOffline).toBe(3);
    expect(() => parseMinistryReport({ ...base, method: "Both", platform: "whatsapp", onlineCount: "2", offlineCount: "2" })).toThrow();
  });
  it("retains unspecified optional inputs separately from legacy numerical projections", () => {
    const report = parseMinistryReport({ kind: "follow_up", peopleCount: 3, contacts: [], outcomes: { saved: "", healed: "0" }, context: "", note: "", method: "Phone call" });
    expect(report.activity.followUps).toBe(3);
    expect(report.enteredOutcomes).toEqual({ saved: "", healed: "0" });
  });
  it("Teaching uses one subject and Prayer never accepts a subject", () => {
    expect(parseSharedMeeting({ kind: "teaching_meeting", subject: "The life of faith", totalAttendance: 12 }).subject).toBe("The life of faith");
    expect(() => parseSharedMeeting({ kind: "teaching_meeting", subject: "", totalAttendance: 12 })).toThrow();
    expect(() => parseSharedMeeting({ kind: "prayer_meeting", subject: "A subject", venue: "Hall", startsAt: "2026-10-13T17:00:00+01:00", endsAt: "2026-10-13T18:00:00+01:00", totalAttendance: 12 })).toThrow();
  });
  it("requires explicit chronological prayer instants, never guessing an overnight end", () => {
    const prayer = { kind: "prayer_meeting", venue: "Hall", startsAt: "2026-10-13T18:00:00+01:00", endsAt: "2026-10-13T19:00:00+01:00", totalAttendance: 12 };
    expect(parseSharedMeeting(prayer).subject).toBeNull();
    expect(() => parseSharedMeeting({ ...prayer, endsAt: "2026-10-13T17:00:00+01:00" })).toThrow();
    expect(() => parseSharedMeeting({ ...prayer, startsAt: "6 pm" })).toThrow();
  });
});
