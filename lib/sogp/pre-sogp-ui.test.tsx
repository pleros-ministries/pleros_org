import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

function source(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Pre-SOGP learner UI", () => {
  test("renders the calendar before selected-day content on mobile", () => {
    const page = source("components/sogp/pre-sogp-page.tsx");
    const navigation = page.indexOf('aria-label="Pre-SOGP dashboard navigation"');
    const countdown = page.indexOf('data-pre-sogp-section="countdown"');
    const calendar = page.indexOf('data-pre-sogp-section="calendar"');
    const dailyContent = page.indexOf('data-pre-sogp-section="daily-content"');
    const progress = page.indexOf('data-pre-sogp-section="progress"');

    expect(navigation).toBeGreaterThan(-1);
    expect(countdown).toBeGreaterThan(-1);
    expect(countdown).toBeGreaterThan(navigation);
    expect(calendar).toBeGreaterThan(countdown);
    expect(dailyContent).toBeGreaterThan(calendar);
    expect(progress).toBeGreaterThan(dailyContent);
    expect(page).toContain(
      "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]",
    );
    expect(page).toContain(
      'href={preview ? "/preview/dashboard" : "/dashboard"}',
    );
    expect(page).toContain(
      'className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 lg:col-span-2"',
    );
    expect(page).toContain("isPreparationUpcoming");
    expect(page).toContain("Pre-SOGP is coming soon");
    expect(page).toContain("Video 1 opens at 12:00 am WAT");
  });

  test("includes streaming teaching and manual daily requirements", () => {
    const page = source("components/sogp/pre-sogp-page.tsx");
    expect(page).toContain("<SogpLessonHeading");
    expect(page).toContain('eyebrow="Current day"');
    expect(page).toContain("<SogpActivitySection");
    expect(page).toContain("<SogpLessonMedia");
    expect(page).not.toContain(
      '<video controls playsInline preload="metadata" src={selectedDay.lesson.url}',
    );
    expect(page).toContain(
      "title={`Preparation lesson ${selectedDay.dayNumber}`}",
    );
    expect(page).not.toContain(
      "Watch today’s lesson, then mark it complete below.",
    );
    expect(page).toContain("<h3");
    expect(page).toContain("{selectedDay.lesson.title}");
    expect(page).not.toContain("text-3xl font-semibold");
    expect(page).not.toContain("Download teaching");
    expect(page).not.toContain("DownloadIcon");
    expect(page).not.toContain("Watching or downloading");
    expect(page).toContain("Pleros Live");
    expect(page).toContain('actionLabel: "I joined"');
    expect(page).toContain('actionLabel: "I\'ve watched lesson"');
    expect(page).toContain("onMutate");
    expect(page).toContain("onError");
    expect(page).toContain("Preparation progress");
    expect(page).toContain(
      "{completeDays} of {PRE_SOGP_PREPARATION_DAYS} days",
    );
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
