import { beforeEach, expect, test, vi } from "vitest";

const reads = vi.hoisted(() => ({ course: vi.fn(), activities: vi.fn(), devotional: vi.fn(), declarations: vi.fn(), support: vi.fn(), context: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/community/context", () => ({ getCommunityContext: reads.context }));
vi.mock("@/lib/db/queries/sogp", () => ({ getSogpDashboardData: reads.course }));
vi.mock("@/lib/db/queries/ministry-activities", () => ({ listActivitiesForDay: reads.activities, getDayActivity: reads.devotional }));
vi.mock("@/lib/db/queries/daily-report-declarations", () => ({ getOwnDailyDeclarations: reads.declarations }));
vi.mock("@/lib/db/queries/community-discipleship", () => ({ getOwnDisciplerSummary: reads.support }));
vi.mock("@/lib/sogp/daily-date", () => ({ lagosToday: () => "2026-10-13" }));
import { getDashboardHomeData } from "./home-data";
import type { getDashboardViewer } from "./viewer";

function viewer(enabled = true) {
  return { session: { user: { id: "own-user" } }, capabilities: { sogpEnrolled: enabled, reporting: enabled, community: enabled } } as NonNullable<Awaited<ReturnType<typeof getDashboardViewer>>>;
}
beforeEach(() => {
  vi.clearAllMocks();
  reads.context.mockResolvedValue({ userId: "own-user" });
  reads.course.mockResolvedValue({
    enrollment: { email: "PRIVATE_EMAIL", phone: "PRIVATE_PHONE" },
    tracks: [
      { dayNumber: 1, accessible: true, completed: true, lesson: { title: "Completed", status: "published", notesContent: "PRIVATE_NOTES" } },
      { dayNumber: 2, accessible: false, completed: false, lesson: { title: "Locked", status: "published" } },
      { dayNumber: 3, accessible: true, completed: false, lesson: { title: "Next lesson", status: "published" } },
    ],
  });
  reads.activities.mockResolvedValue([{ kind: "outreach", note: "PRIVATE_NOTE" }]);
  reads.devotional.mockResolvedValue({ bible: null, prayerWatch: ["morning"], podcastEpisodes: 0, sogp: null });
  reads.declarations.mockResolvedValue([]);
  reads.support.mockResolvedValue(null);
});

test("home reads are self-scoped, use the existing access rules, and expose a narrow DTO", async () => {
  const data = await getDashboardHomeData(viewer());
  expect(reads.course).toHaveBeenCalledWith("own-user");
  expect(reads.activities).toHaveBeenCalledWith("own-user", "2026-10-13");
  expect(reads.declarations).toHaveBeenCalledWith("own-user", "2026-10-13");
  expect(data.learning).toMatchObject({ title: "Next lesson", href: "/dashboard/sogp/course/day/3", completed: 1, total: 3 });
  expect(JSON.stringify(data)).not.toContain("PRIVATE_");
});
test("missing capabilities skip course/report/support reads rather than granting access", async () => {
  const data = await getDashboardHomeData(viewer(false));
  expect(reads.course).not.toHaveBeenCalled();
  expect(reads.activities).not.toHaveBeenCalled();
  expect(reads.declarations).not.toHaveBeenCalled();
  expect(reads.support).not.toHaveBeenCalled();
  expect(data.reports).toBeNull();
  expect(data.learning.href).toBe("/sogp/enrol");
});
test("read failures propagate to the error boundary instead of manufacturing zero counts", async () => {
  reads.activities.mockRejectedValue(new Error("read failed"));
  await expect(getDashboardHomeData(viewer())).rejects.toThrow("read failed");
});
