import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MeetingReportForm } from "@/components/community/report/ministry-v3/meeting-form";

describe("shared meeting presenter", () => {
  it("Teaching uses one subject with separate leader total and personal attendance", () => {
    const html = renderToStaticMarkup(<MeetingReportForm creating dateKey="2026-10-13" contacts={[]} onSave={async () => ({ ok: true })} />);
    expect(html).toContain("Meeting subject");
    expect(html).not.toContain("What was taught");
    expect(html).not.toContain("Meeting name");
    expect(html).toContain("Total meeting attendance");
    expect(html).toContain("Includes you and everyone present.");
    expect(html).not.toContain('checked=""');
  });
  it("Prayer asks for venue and explicit Lagos times, never a subject", () => {
    const html = renderToStaticMarkup(<MeetingReportForm creating initialKind="prayer_meeting" dateKey="2026-10-13" contacts={[]} onSave={async () => ({ ok: true })} />);
    expect(html).toContain("Venue");
    expect(html).toContain("Start · Lagos (WAT)");
    expect(html).not.toContain("Meeting subject");
  });
  it("attendees cannot change shared facts or enter a total", () => {
    const html = renderToStaticMarkup(<MeetingReportForm dateKey="2026-10-13" contacts={[]} meeting={{ id: 1, unitId: 1, kind: "teaching_meeting", meetingDate: "2026-10-13", subject: "Life of faith", venue: null, startsAt: null, endsAt: null, totalAttendance: 12 }} onSave={async () => ({ ok: true })} />);
    expect(html).toContain("Meeting details are read-only.");
    expect(html).toContain("Worker");
    expect(html).toContain("Disciple");
    expect(html).not.toContain("Total meeting attendance");
    expect(html).not.toContain("Others without names");
  });
});
