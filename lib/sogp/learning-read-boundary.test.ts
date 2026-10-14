import { beforeEach, expect, test, vi } from "vitest";
const context = vi.hoisted(() => ({ userId: "learner" as string | null,enrolled: true }));
vi.mock("@/lib/app-session",() => ({ getAppSession: async () => context.userId ? { user: { id: context.userId } } : null }));
vi.mock("@/lib/db/queries/sogp-learning-view",() => ({ getOwnLearningView: async (userId: string) => context.enrolled ? { state: null,episodes: [],canWrite: false,traditional: { completed: 0,total: 0,nextTitle: null,resumeHref: `/dashboard/sogp/traditional?testOwner=${userId}` } } : null }));
import { GET } from "@/app/api/sogp/learning/route";
beforeEach(() => { context.userId = "learner";context.enrolled = true; });
test("learning GET refuses signed-out and unenrolled requests",async () => {
  context.userId = null;
  expect((await GET()).status).toBe(401);
  context.userId = "staff-without-enrolment";context.enrolled = false;
  expect((await GET()).status).toBe(403);
});
test("learning GET returns only the session-owned view and disables shared caching",async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect((await response.json()).traditional.resumeHref).toBe("/dashboard/sogp/traditional?testOwner=learner");
});
