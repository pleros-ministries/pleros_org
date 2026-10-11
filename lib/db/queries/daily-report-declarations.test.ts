import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ select: vi.fn(), transaction: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));
vi.mock("@/lib/db/transaction", () => ({ transactionDb: { transaction: mocks.transaction } }));
import { declareOwnDailyReport, getOwnDailyDeclarations, getOwnMeetingDetails } from "./daily-report-declarations";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("does not touch unmigrated tables while reporting V2 is disabled", async () => {
  vi.stubEnv("DASHBOARD_DAILY_REPORTS_V2", "");
  expect(await getOwnDailyDeclarations("owner", "2026-10-09")).toEqual([]);
  expect(await getOwnMeetingDetails("owner", "2026-10-09")).toEqual([]);
  await expect(declareOwnDailyReport("owner", { dateKey: "2026-10-09", category: "meetings", declaration: "nil" })).rejects.toThrow("not available");
  expect(mocks.select).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("rejects invalid declarations before opening a transaction", async () => {
  vi.stubEnv("DASHBOARD_DAILY_REPORTS_V2", "1");
  await expect(declareOwnDailyReport("owner", { dateKey: "not-a-date", category: "meetings", declaration: "nil" })).rejects.toThrow("view only");
  expect(mocks.transaction).not.toHaveBeenCalled();
});
