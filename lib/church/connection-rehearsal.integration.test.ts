import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as Schema from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

const runtime = vi.hoisted(() => ({
  db: null as unknown as NodePgDatabase<typeof Schema>,
  pool: null as unknown as { end(): Promise<void> },
  push: vi.fn(async () => ({ delivered: 1, failed: 0, pruned: 0 })),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/push/send", () => ({ sendPushToUser: runtime.push }));
vi.mock("@/lib/db", async () => {
  const root = process.env.PLEROS_REHEARSAL_ROOT;
  if (!root?.startsWith("/tmp/pleros-rehearsal.")) throw new Error("Use the dedicated local rehearsal directory; never a production connection URL.");
  const pg = await import(/* @vite-ignore */ `${root}/runtime/node_modules/pg/lib/index.js`);
  const Pool = pg.Pool ?? pg.default.Pool;
  const pool = new Pool({ host: `${root}/socket`, port: 55439, user: "pleros_test", database: "pleros_connections", max: 8 });
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const schema = await import("@/lib/db/schema");
  runtime.pool = pool; runtime.db = drizzle(pool, { schema });
  return { db: runtime.db };
});
vi.mock("@/lib/db/transaction", () => ({ transactionDb: { transaction: (callback: Parameters<typeof runtime.db.transaction>[0]) => runtime.db.transaction(callback) } }));

/** Opt-in, local-socket-only rehearsal. Ordinary unit test runs skip it. */
describe.skipIf(!process.env.PLEROS_REHEARSAL_ROOT)("database-backed dashboard connections", () => {
  let church: typeof import("@/lib/db/queries/church-organisation");
  let reports: typeof import("@/lib/db/queries/church-reports");
  let declarations: typeof import("@/lib/db/queries/daily-report-declarations");
  let activities: typeof import("@/lib/db/queries/ministry-activities");
  let notifications: typeof import("@/lib/notifications/daily-report-dispatch");
  let schema: typeof Schema;
  const today = "2026-10-11";
  const numbers = { reachedOnline: 0, reachedOffline: 12, attendance: 0, saved: 1, notSaved: 11, filled: 0, healed: 0, followUps: 0 };
  let branch1: number; let branch2: number; let unit1: number; let unit2: number;
  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-11T20:00:00Z"));
    vi.stubEnv("DASHBOARD_DAILY_REPORTS_V2", "1"); vi.stubEnv("DASHBOARD_CHURCH_V2", "1"); vi.stubEnv("DASHBOARD_REPORT_REMINDERS_V2", "1");
    [church, reports, declarations, activities, notifications, schema] = await Promise.all([
      import("@/lib/db/queries/church-organisation"), import("@/lib/db/queries/church-reports"), import("@/lib/db/queries/daily-report-declarations"),
      import("@/lib/db/queries/ministry-activities"), import("@/lib/notifications/daily-report-dispatch"), import("@/lib/db/schema"),
    ]);
    await runtime.db.execute(sql`truncate table ${schema.users}, ${schema.churchBranches} restart identity cascade`);
    await runtime.db.execute(sql`truncate table ${schema.notificationCheckpoints}`);
    await runtime.db.insert(schema.users).values(["p", "b1", "b2", "l1", "l2", "w1", "w2", "unassigned"].map((id) => ({ id, name: `Synthetic ${id}`, email: `${id}@rehearsal.example.test`, role: "student" as const })));
    await church.assignChurchMember("p", { userId: "p", role: "pastor", branchId: null, unitId: null, supervisorId: null }, true);
    await church.createChurchPlace("p", { name: "Synthetic branch 1" }); await church.createChurchPlace("p", { name: "Synthetic branch 2" });
    const branches = await runtime.db.select().from(schema.churchBranches).orderBy(schema.churchBranches.id);
    [branch1, branch2] = branches.map((row) => row.id);
    await church.assignChurchMember("p", { userId: "b1", role: "branch_pastor", branchId: branch1, unitId: null, supervisorId: "p" });
    await church.assignChurchMember("p", { userId: "b2", role: "branch_pastor", branchId: branch2, unitId: null, supervisorId: "p" });
    await church.createChurchPlace("b1", { name: "Synthetic unit 1", branchId: branch1 }); await church.createChurchPlace("b2", { name: "Synthetic unit 2", branchId: branch2 });
    const units = await runtime.db.select().from(schema.churchUnits).orderBy(schema.churchUnits.id); [unit1, unit2] = units.map((row) => row.id);
    await church.assignChurchMember("b1", { userId: "l1", role: "unit_leader", branchId: branch1, unitId: unit1, supervisorId: "b1" });
    await church.assignChurchMember("b2", { userId: "l2", role: "unit_leader", branchId: branch2, unitId: unit2, supervisorId: "b2" });
    await church.assignChurchMember("b1", { userId: "w1", role: "worker", branchId: branch1, unitId: unit1, supervisorId: "l1" });
    await church.assignChurchMember("b2", { userId: "w2", role: "worker", branchId: branch2, unitId: unit2, supervisorId: "l2" });
  }, 30_000);
  afterAll(async () => { vi.useRealTimers(); vi.unstubAllEnvs(); await runtime.pool?.end(); });

  it("enforces appointment authority and branch scope inside real transactions", async () => {
    await expect(church.assignChurchMember("l1", { userId: "unassigned", role: "worker", branchId: branch1, unitId: unit1, supervisorId: "l1" })).rejects.toThrow("cannot manage");
    await expect(church.assignChurchMember("b1", { userId: "w2", role: "worker", branchId: branch1, unitId: unit1, supervisorId: "l1" })).rejects.toThrow("your branch");
    await expect(church.createChurchPlace("b1", { name: "Wrong branch", branchId: branch2 })).rejects.toThrow("own branch");
    await expect(church.assignChurchMember("p", { userId: "l1", role: "unit_leader", branchId: branch2, unitId: unit2, supervisorId: "b2" })).rejects.toThrow("direct reports");
    expect((await church.getChurchRoster("l1")).map((row) => row.userId)).toEqual(["w1"]);
  });
  it("rejects invalid assignment shapes and a second Pastor at the database boundary", async () => {
    await expect(runtime.db.insert(schema.churchAssignments).values({ userId: "unassigned", role: "unit_leader", branchId: null, unitId: null, supervisorId: "b1", assignedBy: "p" })).rejects.toThrow();
    await expect(runtime.db.insert(schema.churchAssignments).values({ userId: "unassigned", role: "pastor", branchId: null, unitId: null, supervisorId: null, assignedBy: "p" })).rejects.toThrow();
  });
  it("clears concurrent Nil without losing the activity and rejects future/out-of-window declarations", async () => {
    const dateKey = "2026-10-10";
    await declarations.declareOwnDailyReport("w1", { dateKey, category: "ministry", declaration: "nil" });
    expect(await declarations.getOwnDailyDeclarations("w1", dateKey)).toContainEqual({ category: "ministry", declaration: "nil" });
    await Promise.allSettled([
      declarations.declareOwnDailyReport("w1", { dateKey, category: "ministry", declaration: "nil" }),
      activities.saveActivity({ userId: "w1", activityId: null, dateKey, activity: { ...numbers, kind: "outreach", title: null, mode: "offline", platform: null, location: "Synthetic location", note: "Private note" }, people: [], followUps: [] }),
    ]);
    expect(await declarations.getOwnDailyDeclarations("w1", dateKey)).not.toContainEqual({ category: "ministry", declaration: "nil" });
    expect(await activities.listActivitiesForDay("w1", dateKey)).toHaveLength(1);
    await expect(declarations.declareOwnDailyReport("w1", { dateKey: "2026-10-03", category: "meetings", declaration: "nil" })).rejects.toThrow("view only");
    await expect(declarations.declareOwnDailyReport("w1", { dateKey: "2026-10-12", category: "meetings", declaration: "nil" })).rejects.toThrow("view only");
  });
  it("persists meeting metadata with its activity and rejects another owner's edit", async () => {
    const result = await activities.saveActivity({ userId: "w1", activityId: null, dateKey: today, activity: { ...numbers, attendance: 4, kind: "teaching_meeting", title: "Synthetic meeting", mode: null, platform: null, location: null, note: "Private meeting note" }, meetingDetails: { role: "leader", taught: "Synthetic teaching" }, people: [], followUps: [] });
    await runtime.db.insert(schema.outreachContacts).values({ userId: "w1", activityId: result.activityId, metDate: today, name: "Synthetic private contact", phone: "+10000000000", note: "Synthetic private contact note" });
    expect(await declarations.getOwnMeetingDetails("w1", today)).toContainEqual({ activityId: result.activityId, reportingRole: "leader", taught: "Synthetic teaching" });
    expect(await declarations.getOwnMeetingDetails("w2", today)).toEqual([]);
    await expect(activities.saveActivity({ userId: "w2", activityId: result.activityId, dateKey: today, activity: { ...numbers, kind: "teaching_meeting", title: null, mode: null, platform: null, location: null, note: null }, people: [], followUps: [] })).rejects.toThrow("no longer there");
  });
  it("returns direct-worker details without notes or contacts and denies cross-branch/upward access", async () => {
    const report = await reports.getChurchReport("l1", "w1", today);
    expect(report.activities[0].meeting?.taught).toBe("Synthetic teaching");
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("Private meeting note"); expect(serialized).not.toContain("contactIds"); expect(serialized).not.toContain("peopleCount"); expect(serialized).not.toContain("Synthetic private contact"); expect(serialized).not.toContain("+10000000000");
    await expect(reports.getChurchReport("l1", "w2", today)).rejects.toThrow("outside your oversight");
    await expect(reports.getChurchReport("w1", "l1", today)).rejects.toThrow("outside your oversight");
    expect((await reports.getChurchRosterDay("l1", today))[0].statuses.meetings).toBe("reported");
  });
  it("shares manual/automatic daily caps atomically and keeps push consent off by default", async () => {
    const outcomes = await Promise.all([
      notifications.sendDailyReportReminder({ subjectId: "w2", source: "manual", viewerId: "l2", reportDate: "2026-10-10" }),
      notifications.sendDailyReportReminder({ subjectId: "w2", source: "automatic", reportDate: today }),
    ]);
    expect(outcomes.filter((outcome) => outcome.sent)).toHaveLength(1);
    expect(await runtime.db.select().from(schema.communityNotifications).where(and(eq(schema.communityNotifications.userId, "w2"), eq(schema.communityNotifications.kind, "daily_report_reminder")))).toHaveLength(1);
    expect(runtime.push).not.toHaveBeenCalled();
    await expect(notifications.sendDailyReportReminder({ subjectId: "w2", source: "manual", viewerId: "l1", reportDate: today })).rejects.toThrow("outside your oversight");
    await runtime.db.insert(schema.dailyReportPreferences).values({ userId: "w1", pushEnabled: true });
    expect((await notifications.sendDailyReportReminder({ subjectId: "w1", source: "manual", viewerId: "l1", reportDate: today })).sent).toBe(true);
    expect(runtime.push).toHaveBeenCalledTimes(1);
    expect(runtime.push.mock.calls[0]).toEqual(["w1", expect.objectContaining({ title: "Daily report reminder" }), { gate: "community" }]);
  });
  it("suppresses reminders after all three categories are submitted", async () => {
    await declarations.declareOwnDailyReport("w2", { dateKey: "2026-10-09", category: "devotional", declaration: "confirmed" });
    await declarations.declareOwnDailyReport("w2", { dateKey: "2026-10-09", category: "ministry", declaration: "nil" });
    await declarations.declareOwnDailyReport("w2", { dateKey: "2026-10-09", category: "meetings", declaration: "nil" });
    await runtime.db.delete(schema.notificationCheckpoints).where(eq(schema.notificationCheckpoints.key, "daily-report:w2:2026-10-11"));
    expect((await notifications.sendDailyReportReminder({ subjectId: "w2", source: "manual", viewerId: "l2", reportDate: "2026-10-09" })).sent).toBe(false);
  });
});
