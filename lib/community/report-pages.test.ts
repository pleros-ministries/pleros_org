import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("the daily report routes", () => {
  const reportDir = ["app", "(site)", "dashboard", "community", "report"];

  test("the Report tab reads the day's activities and nothing of the old report", () => {
    const page = read(...reportDir, "page.tsx");
    expect(page).toContain("listActivitiesForDay");
    expect(page).toContain("getDayActivity");
    expect(page).not.toContain("listReportsForUser");
    expect(page).not.toContain("ministry-reports");
  });

  test("adding and editing stay inside the reporting window", () => {
    const create = read(...reportDir, "new", "page.tsx");
    expect(create).toContain("returnTo=/dashboard/community/report/new");
    expect(create).toContain("reportableDateKeys");
    expect(create).toContain('mode="create"');

    const edit = read(...reportDir, "[activityId]", "page.tsx");
    expect(edit).toContain("notFound(");
    expect(edit).toContain("canReportFor");
    expect(edit).toContain("getActivityForEdit");
    expect(edit).toContain("This day can no longer be changed.");
  });

  test("the History tab carries the totals and the two-week table", () => {
    const history = read(...reportDir, "history", "page.tsx");
    expect(history).toContain("listActivitiesForUser");
    expect(history).toContain("getActivityRange");
    const view = read("components", "community", "report", "report-history-view.tsx");
    expect(view).toContain("Last 7 days");
    expect(view).toContain("This month");
  });

  test("the tabs are Report, People and History", () => {
    const tabs = read("components", "community", "report", "report-tabs.tsx");
    expect(tabs).toContain('href: "/dashboard/community/report/history"');
    expect(tabs).toContain('label: "People"');
    expect(tabs).toContain('aria-current={selected ? "page" : undefined}');
  });
});

describe("the activity form", () => {
  const formDir = ["components", "community", "report", "activity-form"];

  test("checks each step on Next only, and never uses browser storage", () => {
    const form = read(...formDir, "activity-form.tsx");
    expect(form).toContain("noValidate");
    expect(form).toContain("validateStep");
    expect(form).toContain("firstErrorId");
    expect(form).toContain("saveMinistryActivity(");
    expect(form).not.toContain("localStorage");
    expect(form).not.toContain("sessionStorage");
  });

  test("marks invalid controls for assistive tech", () => {
    const field = read(...formDir, "field.tsx");
    expect(field).toContain('"aria-invalid"');
    expect(field).toContain('"aria-describedby"');
    const numbers = read(...formDir, "step-numbers.tsx");
    expect(numbers).toContain('inputMode="numeric"');
    expect(numbers).toContain("activityFields(");
  });

  test("the kind is locked when editing", () => {
    const kind = read(...formDir, "step-kind.tsx");
    expect(kind).toContain("To change the kind, remove this activity and add it again.");
  });
});

describe("the people list", () => {
  test("logs follow-ups instead of ticking a box", () => {
    const row = read("components", "community", "report", "outreach-contacts.tsx");
    expect(row).not.toContain('type="checkbox"');
    expect(row).toContain("Log a follow-up");
    expect(row).toContain("Edit details");
    expect(row).toContain("removeOutreachContactAction");
  });

  test("filters by salvation and discipleship status", () => {
    const browser = read("components", "community", "report", "outreach-contact-browser.tsx");
    expect(browser).toContain("SALVATION_STATUSES");
    expect(browser).toContain("DISCIPLESHIP_STATUSES");
    expect(browser).toContain("isFollowUpDue");
  });
});

describe("the staff views", () => {
  test("the admin page sorts by activities and shows people present", () => {
    const admin = read("components", "community", "admin-ministry-page.tsx");
    expect(admin).toContain('sortKey="activities"');
    expect(admin).toContain('sortKey="days"');
    expect(admin).toContain('sortKey="members"');
    expect(admin).toContain("MemberActivityList");
    expect(admin).toContain("By kind:");
  });

  test("the discipler sees summed numbers only", () => {
    const actions = read("app", "(site)", "dashboard", "community", "_actions", "report-actions.ts");
    expect(actions).toContain("getDisciplesMinistryDay");
    expect(actions).toContain("Never includes a note, place or person.");
    const page = read("components", "sogp", "discipleship-page.tsx");
    expect(page).toContain("report.reachedOnline + report.reachedOffline + report.attendance");
  });
});
