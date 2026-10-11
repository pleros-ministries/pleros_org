import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ select: vi.fn(), transaction: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));
vi.mock("@/lib/db/transaction", () => ({ transactionDb: { transaction: mocks.transaction } }));
import { getChurchAssignment, getChurchRoster, getChurchStructure, hasChurchDirectReports, assignChurchMember } from "./church-organisation";
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("does not query unmigrated church tables while disabled", async () => {
  vi.stubEnv("DASHBOARD_CHURCH_V2", "0");
  expect(await getChurchAssignment("owner")).toBeNull();
  expect(await getChurchRoster("owner")).toEqual([]);
  expect(await getChurchStructure("owner", true)).toEqual({ branches: [], units: [] });
  expect(await hasChurchDirectReports("owner")).toBe(false);
  await expect(assignChurchMember("owner", { userId: "worker", role: "worker", branchId: 1, unitId: 2, supervisorId: "leader" })).rejects.toThrow("not enabled");
  expect(mocks.select).not.toHaveBeenCalled(); expect(mocks.transaction).not.toHaveBeenCalled();
});
