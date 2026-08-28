import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

function source(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Pre-SOGP learner UI", () => {
  test("renders the calendar before selected-day content on mobile", () => {
    const page = source("components/sogp/pre-sogp-page.tsx");
    const countdown = page.indexOf('data-pre-sogp-section="countdown"');
    const calendar = page.indexOf('data-pre-sogp-section="calendar"');
    const dailyContent = page.indexOf('data-pre-sogp-section="daily-content"');
    const progress = page.indexOf('data-pre-sogp-section="progress"');

    expect(countdown).toBeGreaterThan(-1);
    expect(calendar).toBeGreaterThan(countdown);
    expect(dailyContent).toBeGreaterThan(calendar);
    expect(progress).toBeGreaterThan(dailyContent);
  });

  test("includes downloadable teaching and manual daily requirements", () => {
    const page = source("components/sogp/pre-sogp-page.tsx");
    expect(page).toContain("Download teaching");
    expect(page).toContain("Pleros Live");
    expect(page).toContain("I joined Prayer Watch");
    expect(page).toContain("Mark lesson complete");
    expect(page).toContain("onMutate");
    expect(page).toContain("onError");
  });

  test("calendar exposes text labels for every state", () => {
    const calendar = source("components/sogp/sogp-calendar.tsx");
    expect(calendar).toContain('complete: "Complete"');
    expect(calendar).toContain('missed: "Missed"');
    expect(calendar).toContain('current: "Today — incomplete"');
    expect(calendar).toContain('future: "Upcoming"');
  });

  test("route requires an authenticated SOGP enrolment", () => {
    const route = source("app/(site)/dashboard/pre-sogp/page.tsx");
    expect(route).toContain("getAppSession");
    expect(route).toContain("getSogpEnrollmentByUserId");
    expect(route).toContain('redirect("/sogp/enrol")');
    expect(route).toContain("SogpQueryProvider");
  });
});
