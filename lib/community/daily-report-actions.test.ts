import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ context: vi.fn(), write: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/community/context", () => ({ getCommunityContext: mocks.context, canAccessCommunity: (ctx: { enrollmentId: number | null } | null) => ctx?.enrollmentId != null }));
vi.mock("@/lib/db/queries/daily-report-declarations", () => ({ declareOwnDailyReport: mocks.write }));
import { declareDailyReport } from "@/app/(site)/dashboard/community/_actions/daily-report-actions";

beforeEach(() => { vi.clearAllMocks(); mocks.write.mockResolvedValue(undefined); });
it("derives the report subject and actor from the session context, ignoring a forged subject", async () => {
  mocks.context.mockResolvedValue({ userId: "authenticated-owner", enrollmentId: 1 });
  const input = { dateKey: "2026-10-09", category: "meetings" as const, declaration: "nil" as const, userId: "someone-else", actorUserId: "someone-else" };
  expect(await declareDailyReport(input)).toEqual({ ok: true });
  expect(mocks.write).toHaveBeenCalledWith("authenticated-owner", { dateKey: input.dateKey, category: "meetings", declaration: "nil" });
});
it("refuses a missing community session without issuing a write", async () => {
  mocks.context.mockResolvedValue(null);
  expect((await declareDailyReport({ dateKey: "2026-10-09", category: "meetings", declaration: "nil" })).ok).toBe(false);
  expect(mocks.write).not.toHaveBeenCalled();
});
