import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as Schema from "@/lib/db/schema";
import { sql } from "drizzle-orm";

const runtime = vi.hoisted(() => ({
  db: null as unknown as NodePgDatabase<typeof Schema>,
  pool: null as unknown as { end(): Promise<void> },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", async () => {
  const root = process.env.PLEROS_APPOINTMENT_REHEARSAL_ROOT;
  if (!root?.startsWith("/tmp/pleros-rehearsal.")) throw new Error("Use an isolated local rehearsal socket, never a shared database URL.");
  const pg = await import(/* @vite-ignore */ `${root}/runtime/node_modules/pg/lib/index.js`);
  const Pool = pg.Pool ?? pg.default.Pool;
  const pool = new Pool({ host: `${root}/socket`, port: 55439, user: "pleros_test", database: "pleros_appointments" });
  const { drizzle } = await import("drizzle-orm/node-postgres");
  runtime.pool = pool;
  runtime.db = drizzle(pool, { schema: await import("@/lib/db/schema") });
  return { db: runtime.db };
});
vi.mock("@/lib/db/transaction", () => ({ transactionDb: { transaction: (callback: Parameters<typeof runtime.db.transaction>[0]) => runtime.db.transaction(callback) } }));

/** Explicit opt-in: synthetic users and current church DDL in a disposable local database. */
describe.skipIf(!process.env.PLEROS_APPOINTMENT_REHEARSAL_ROOT)("church appointment authority (real transactions)", () => {
  let church: typeof import("@/lib/db/queries/church-organisation");
  beforeAll(async () => {
    vi.stubEnv("DASHBOARD_CHURCH_V2", "1");
    vi.stubEnv("DASHBOARD_CHURCH_MULTI_BRANCH_V2", "1");
    church = await import("@/lib/db/queries/church-organisation");
    await runtime.db.execute(sql`create table users (id text primary key)`);
    for (const path of ["drizzle/0051_church_organisation_v2.sql", "drizzle/0053_church_multi_branch_pastors.sql"]) {
      await runtime.db.execute(sql.raw(await readFile(path, "utf8")));
    }
  });
  beforeEach(async () => {
    vi.stubEnv("DASHBOARD_CHURCH_MULTI_BRANCH_V2", "1");
    await runtime.db.execute(sql`truncate users, church_branches restart identity cascade`);
    await runtime.db.execute(sql`
      insert into users values ('pastor'), ('actor'), ('peer'), ('other'), ('leader'), ('outsider'), ('worker');
      insert into church_branches (id, name) values (1, 'Synthetic A'), (2, 'Synthetic B');
      insert into church_units (id, branch_id, name) values (1, 1, 'A unit'), (2, 2, 'B unit');
      insert into church_assignments (user_id, role, branch_id, unit_id, supervisor_id, assigned_by) values
        ('pastor', 'pastor', null, null, null, 'pastor'),
        ('actor', 'branch_pastor', 1, null, 'pastor', 'pastor'),
        ('peer', 'branch_pastor', 1, null, 'pastor', 'pastor'),
        ('other', 'branch_pastor', 2, null, 'pastor', 'pastor'),
        ('leader', 'unit_leader', 1, 1, 'actor', 'pastor'),
        ('outsider', 'unit_leader', 2, 2, 'other', 'pastor'),
        ('worker', 'worker', 1, 1, 'leader', 'pastor');
      insert into church_branch_pastors values ('actor', 1), ('peer', 1), ('peer', 2), ('other', 2)
    `);
  });
  afterAll(async () => { vi.unstubAllEnvs(); await runtime.pool?.end(); });
  const demotion = (userId: string) => ({ userId, role: "worker" as const, branchId: 1, unitId: 1, supervisorId: "leader" });
  async function state(userId: string) {
    return {
      assignment: (await runtime.db.execute(sql`select role, branch_id, unit_id, supervisor_id from church_assignments where user_id = ${userId}`)).rows,
      branches: (await runtime.db.execute(sql`select branch_id from church_branch_pastors where user_id = ${userId} order by branch_id`)).rows,
    };
  }
  for (const multi of [false, true]) for (const role of ["worker", "unit_leader"] as const) {
    it(`rejects peer demotion to ${role} and preserves every membership (multi-branch ${multi})`, async () => {
      vi.stubEnv("DASHBOARD_CHURCH_MULTI_BRANCH_V2", multi ? "1" : "0");
      const before = await state("peer");
      let error: unknown;
      try { await church.assignChurchMember("actor", { ...demotion("peer"), role, supervisorId: role === "worker" ? "leader" : "actor" }); } catch (caught) { error = caught; }
      const after = await state("peer");
      expect({ rejected: error instanceof Error, after }).toEqual({ rejected: true, after: before });
    });
  }
  it("rejects senior demotion and leaves the Pastor unchanged", async () => {
    const before = await state("pastor");
    await expect(church.assignChurchMember("actor", demotion("pastor"))).rejects.toThrow("your branch");
    expect(await state("pastor")).toEqual(before);
  });
  it("rejects peer membership edits even when a requested branch is shared", async () => {
    const before = await state("peer");
    await expect(church.assignChurchMember("actor", { userId: "peer", role: "branch_pastor", branchId: 1, branchIds: [1], unitId: null, supervisorId: "pastor" })).rejects.toThrow("your branch");
    expect(await state("peer")).toEqual(before);
  });
  it("rejects editing a lower-tier appointment currently outside the actor's branch", async () => {
    await expect(church.assignChurchMember("actor", demotion("outsider"))).rejects.toThrow("your branch");
  });
  it("rejects peer demotion when only the secondary branch is shared", async () => {
    await runtime.db.execute(sql`update church_assignments set branch_id = 2 where user_id = 'peer'`);
    const before = await state("peer");
    await expect(church.assignChurchMember("actor", demotion("peer"))).rejects.toThrow("your branch");
    expect(await state("peer")).toEqual(before);
  });
  it("allows a valid lower-tier edit within the actor's branch", async () => {
    await expect(church.assignChurchMember("actor", demotion("worker"))).resolves.toBeUndefined();
  });
  it("rejects removal of an out-of-scope membership attached to a lower-tier target", async () => {
    await runtime.db.execute(sql`insert into church_branch_pastors values ('worker', 2)`);
    const before = await state("worker");
    let error: unknown;
    try { await church.assignChurchMember("actor", demotion("worker")); } catch (caught) { error = caught; }
    expect({ rejected: error instanceof Error, after: await state("worker") }).toEqual({ rejected: true, after: before });
  });
  it("preserves legitimate Pastor multi-branch appointments and removals", async () => {
    await church.assignChurchMember("pastor", { userId: "peer", role: "branch_pastor", branchId: 2, branchIds: [2], unitId: null, supervisorId: "pastor" });
    expect(await state("peer")).toEqual({ assignment: [{ role: "branch_pastor", branch_id: 2, unit_id: null, supervisor_id: "pastor" }], branches: [{ branch_id: 2 }] });
  });
  it("rejects assigning a worker into an outside branch", async () => {
    await expect(church.assignChurchMember("actor", { ...demotion("worker"), branchId: 2, unitId: 2, supervisorId: "outsider" })).rejects.toThrow("your branch");
  });
  it("checks each requested branch exists, not just the primary", async () => {
    await expect(church.assignChurchMember("pastor", { userId: "peer", role: "branch_pastor", branchId: 1, branchIds: [1, 999], unitId: null, supervisorId: "pastor" })).rejects.toThrow("existing branches");
  });
  it("protects direct reports in a non-primary branch during membership removal", async () => {
    await runtime.db.execute(sql`update church_assignments set supervisor_id = 'peer' where user_id = 'outsider'`);
    await expect(church.assignChurchMember("pastor", { userId: "peer", role: "branch_pastor", branchId: 1, branchIds: [1], unitId: null, supervisorId: "pastor" })).rejects.toThrow("removing their branch");
    await expect(church.assignChurchMember("actor", demotion("peer"))).rejects.toThrow("your branch");
  });
  it("rejects mismatched supervisor and unit branches", async () => {
    await expect(church.assignChurchMember("actor", { ...demotion("worker"), supervisorId: "outsider" })).rejects.toThrow("correct branch");
    await expect(church.assignChurchMember("actor", { userId: "worker", role: "unit_leader", branchId: 1, unitId: 2, supervisorId: "actor" })).rejects.toThrow("unit in that branch");
  });
});
