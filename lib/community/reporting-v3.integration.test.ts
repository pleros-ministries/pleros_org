import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as Schema from "@/lib/db/schema";
import type { CommunityContext } from "@/lib/community/context";
const runtime = vi.hoisted(() => ({ db: null as unknown as NodePgDatabase<typeof Schema>, pool: null as unknown as { end(): Promise<void> } }));
const identity = vi.hoisted(() => ({ ctx: null as CommunityContext | null }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/community/context", async () => {
  const actual = await vi.importActual<typeof import("@/lib/community/context")>("@/lib/community/context");
  return { ...actual, getCommunityContext: async () => identity.ctx };
});
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", async () => {
  const root = process.env.PLEROS_REPORTING_REHEARSAL_ROOT;
  if (!root?.startsWith("/tmp/pleros-rehearsal.")) throw new Error("Use only the disposable local reporting socket.");
  const pg = await import(/* @vite-ignore */ `${root}/runtime/node_modules/pg/lib/index.js`);
  const pool = new (pg.Pool ?? pg.default.Pool)({ host: `${root}/socket`, port: 55439, user: "pleros_test", database: "pleros_reporting" });
  const { drizzle } = await import("drizzle-orm/node-postgres");
  runtime.pool = pool; runtime.db = drizzle(pool, { schema: await import("@/lib/db/schema") });
  return { db: runtime.db };
});
vi.mock("@/lib/db/transaction", () => ({ transactionDb: { transaction: (fn: Parameters<typeof runtime.db.transaction>[0]) => runtime.db.transaction(fn) } }));

describe.skipIf(!process.env.PLEROS_REPORTING_REHEARSAL_ROOT)("slice 2 real transactional rehearsal", () => {
  let contacts: typeof import("@/lib/db/queries/private-ministry-contacts");
  let ministry: typeof import("@/lib/db/queries/ministry-report-v3");
  let meetings: typeof import("@/lib/db/queries/shared-church-meetings");
  const key = "12345678-1234-1234-1234-123456789abc";
  const contactInput = { requestKey: key, name: "Synthetic Ada", phone: "+234 800 000 0102", email: "ada@example.test" };
  const ministryInput = { requestKey: key, dateKey: "2026-10-13", kind: "follow_up", method: "Phone call", context: "", peopleCount: 3, contacts: [], note: "", outcomes: {} };
  const meetingInput = { requestKey: key, dateKey: "2026-10-13", unitId: 1, kind: "teaching_meeting", subject: "Synthetic teaching", totalAttendance: 12, attended: true, contacts: [] };
  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-13T18:00:00Z"));
    vi.stubEnv("DASHBOARD_DAILY_REPORTS_V2", "1"); vi.stubEnv("DASHBOARD_REPORTING_V3", "1"); vi.stubEnv("DASHBOARD_CHURCH_V2", "1"); vi.stubEnv("DASHBOARD_CHURCH_MULTI_BRANCH_V2", "1");
    contacts = await import("@/lib/db/queries/private-ministry-contacts");
    ministry = await import("@/lib/db/queries/ministry-report-v3");
    meetings = await import("@/lib/db/queries/shared-church-meetings");
    // Minimal pre-change schema at the real service seam; not a production clone.
    await runtime.db.execute(sql`
      create table users (id text primary key, name text not null);
      create table ministry_activities (
        id serial primary key, user_id text not null references users(id), activity_date date not null, kind text not null,
        title text, mode text, platform text, location text, note text,
        reached_online integer not null default 0, reached_offline integer not null default 0, attendance integer not null default 0,
        saved integer not null default 0, not_saved integer not null default 0, filled integer not null default 0, healed integer not null default 0, follow_ups integer not null default 0,
        created_at timestamptz not null default now(), updated_at timestamptz not null default now()
      );
      create table outreach_contacts (id serial primary key, user_id text not null references users(id), name text not null, phone text, note text,
        met_date date not null default '2026-10-13', activity_id integer references ministry_activities(id) on delete set null,
        salvation_status text not null default 'unknown', discipleship_status text not null default 'not_started', follow_up_plan text, next_follow_up_date date,
        followed_up_at timestamptz, followed_up_by text references users(id) on delete set null, follow_up_note text, created_at timestamptz default now(), updated_at timestamptz default now());
      create table outreach_contact_interactions (id serial primary key, contact_id integer not null references outreach_contacts(id) on delete cascade,
        user_id text references users(id) on delete set null, activity_id integer references ministry_activities(id) on delete set null,
        interaction_date date not null, kind text not null, saved boolean not null default false, filled boolean not null default false, healed boolean not null default false, note text, created_at timestamptz not null default now());
      create unique index outreach_contact_interactions_activity_contact_idx on outreach_contact_interactions(activity_id,contact_id) where activity_id is not null;
      create table daily_report_declarations (user_id text references users(id), report_date date, category text, declaration text, actor_user_id text, created_at timestamptz default now(), updated_at timestamptz default now(), primary key(user_id,report_date,category))
    `);
    for (const path of ["drizzle/0051_church_organisation_v2.sql", "drizzle/0053_church_multi_branch_pastors.sql", "drizzle/0054_reporting_v3.sql"]) await runtime.db.execute(sql.raw(await readFile(path, "utf8")));
  });
  beforeEach(async () => {
    vi.stubEnv("DASHBOARD_REPORTING_V3", "1");
    vi.stubEnv("DASHBOARD_REPORTING_V3_SCHEMA", "1");
    identity.ctx = { userId: "w", isAdmin: false, enrollmentId: 1, enrolledAt: new Date(), unit: null, membershipRole: null, isUnitLeader: false, managedUnitIds: [], isMinor: false, postingBlocked: false, messagingBlocked: false };
    await runtime.db.execute(sql`truncate users, church_branches restart identity cascade;
      insert into users values ('p','Synthetic Pastor'),('b','Synthetic Branch Pastor'),('u','Synthetic Unit leader'),('w','Synthetic Worker'),('w2','Synthetic Peer'),('outside','Synthetic Outside'),('admin','Synthetic Admin');
      insert into church_branches(id,name) values(1,'A'),(2,'B');
      insert into church_units(id,branch_id,name) values(1,1,'A1'),(2,2,'B1');
      insert into church_assignments(user_id,role,branch_id,unit_id,supervisor_id,assigned_by) values
        ('p','pastor',null,null,null,'p'),('b','branch_pastor',1,null,'p','p'),('u','unit_leader',1,1,'b','p'),('w','worker',1,1,'u','p'),('w2','worker',1,1,'u','p'),('outside','worker',2,2,'u','p');
      insert into church_branch_pastors values('b',1)
    `);
  });
  afterAll(async () => { vi.useRealTimers(); vi.unstubAllEnvs(); await runtime.pool?.end(); });

  it("new contacts are owner-only, absent from legacy readers, and create no account", async () => {
    const row = await contacts.createPrivateMinistryContact("w", contactInput);
    expect(await contacts.listPrivateMinistryContacts("admin")).toEqual([]);
    await expect(contacts.getPrivateMinistryContact("admin", Number(row.key.split(":")[1]))).rejects.toThrow("not on your list");
    expect((await runtime.db.execute(sql`select count(*)::int as n from outreach_contacts`)).rows[0]).toEqual({ n: 0 });
    expect((await runtime.db.execute(sql`select count(*)::int as n from users`)).rows[0]).toEqual({ n: 7 });
  });
  it("concurrent contact retries return one row, without matching another account", async () => {
    const [a,b] = await Promise.all([contacts.createPrivateMinistryContact("w", contactInput), contacts.createPrivateMinistryContact("w", contactInput)]);
    expect(a.key).toBe(b.key);
    await expect(contacts.createPrivateMinistryContact("w", { ...contactInput, name: "Changed" })).rejects.toThrow("different details");
  });
  it("server actions reject signed-out writes and ignore client-supplied identity", async () => {
    const actions = await import("@/app/(site)/dashboard/community/_actions/reporting-v3-actions");
    identity.ctx = null;
    expect((await actions.createPrivateContactAction(contactInput)).ok).toBe(false);
    identity.ctx = { userId: "w", isAdmin: false, enrollmentId: 1, enrolledAt: new Date(), unit: null, membershipRole: null, isUnitLeader: false, managedUnitIds: [], isMinor: false, postingBlocked: false, messagingBlocked: false };
    expect((await actions.createPrivateContactAction({ ...contactInput, userId: "outside" })).ok).toBe(true);
    expect((await contacts.listPrivateMinistryContacts("w")).length).toBe(1);
    expect(await contacts.listPrivateMinistryContacts("outside")).toEqual([]);
  });
  it("optional outcome retries preserve blanks irrespective of JSONB key order", async () => {
    const input = { ...ministryInput, outcomes: { saved: "", filled: "1", healed: "0" } };
    const first = await ministry.saveMinistryReportV3("w", input);
    expect((await ministry.saveMinistryReportV3("w", input)).activityId).toBe(first.activityId);
  });
  it("saves count-only ministry idempotently and clears stale Nil", async () => {
    await runtime.db.execute(sql`insert into daily_report_declarations(user_id,report_date,category,declaration,actor_user_id) values('w','2026-10-13','ministry','nil','w')`);
    const [a,b] = await Promise.all([ministry.saveMinistryReportV3("w", ministryInput), ministry.saveMinistryReportV3("w", ministryInput)]);
    expect(a.activityId).toBe(b.activityId);
    expect((await runtime.db.execute(sql`select count(*)::int as n from daily_report_declarations`)).rows[0]).toEqual({ n: 0 });
    expect((await ministry.getOwnMinistryReportV3("w", a.activityId))?.activity.followUps).toBe(3);
  });
  it("rejects cross-owner attachments and report edits, including legacy contacts", async () => {
    const row = await contacts.createPrivateMinistryContact("w", contactInput);
    await expect(ministry.saveMinistryReportV3("w2", { ...ministryInput, contacts: [row.key] })).rejects.toThrow("not on your list");
    await runtime.db.execute(sql`insert into outreach_contacts(id,user_id,name) values(1,'w','Synthetic old contact')`);
    await expect(ministry.saveMinistryReportV3("w2", { ...ministryInput, contacts: ['legacy:1'] })).rejects.toThrow("not on your list");
    const report = await ministry.saveMinistryReportV3("w", ministryInput);
    await expect(ministry.saveMinistryReportV3("w2", { ...ministryInput, activityId: report.activityId })).rejects.toThrow();
    expect(await ministry.getOwnMinistryReportV3("w2", report.activityId)).toBeNull();
  });
  it("removing a report association keeps the saved contact and allows legacy no-phone picks", async () => {
    const row = await contacts.createPrivateMinistryContact("w", contactInput);
    await runtime.db.execute(sql`insert into outreach_contacts(id,user_id,name) values(1,'w','Synthetic retained contact')`);
    const report = await ministry.saveMinistryReportV3("w", { ...ministryInput, contacts: [row.key, 'legacy:1'] });
    await ministry.saveMinistryReportV3("w", { ...ministryInput, activityId: report.activityId, contacts: [] });
    expect((await contacts.listReportContactChoices("w")).length).toBe(2);
  });
  it("legacy discipleship picks keep their interaction history and follow-up status", async () => {
    await runtime.db.execute(sql`insert into outreach_contacts(id,user_id,name) values(1,'w','Synthetic old contact')`);
    const report = await ministry.saveMinistryReportV3("w", { ...ministryInput, contacts: ['legacy:1'] });
    expect((await runtime.db.execute(sql`select kind from outreach_contact_interactions where activity_id=${report.activityId}`)).rows).toEqual([{ kind: "call" }]);
    expect((await runtime.db.execute(sql`select followed_up_at is not null as followed from outreach_contacts where id=1`)).rows[0]).toEqual({ followed: true });
  });
  it("overnight prayer belongs to its Lagos start day with an explicit next-day end", async () => {
    await meetings.createSharedChurchMeeting("w", { ...meetingInput, kind: "prayer_meeting", subject: "", venue: "Hall", startsAt: "2026-10-13T23:00:00+01:00", endsAt: "2026-10-14T01:00:00+01:00" });
    expect((await meetings.listSharedChurchMeetings("w2", 1, "2026-10-13"))[0].meetingDate).toBe("2026-10-13");
    expect(await meetings.listSharedChurchMeetings("w2", 1, "2026-10-14")).toEqual([]);
    await expect(meetings.createSharedChurchMeeting("w", { ...meetingInput, kind: "prayer_meeting", subject: "", venue: "Hall", startsAt: "2026-10-14T23:00:00+01:00", endsAt: "2026-10-15T01:00:00+01:00" })).rejects.toThrow("selected Lagos day");
  });
  it.each(["w", "u", "b", "p"])("allows %s to create first without changing appointments", async user => {
    const meeting = await meetings.createSharedChurchMeeting(user, meetingInput);
    const rows = await meetings.listSharedChurchMeetings("w2", 1, "2026-10-13");
    expect(rows[0].id).toBe(meeting.meetingId);
    expect(rows[0].totalAttendance).toBe(12);
    expect((await runtime.db.execute(sql`select role from church_assignments where user_id = ${user}`)).rows[0]).toEqual({ role: user === "w" ? "worker" : user === "u" ? "unit_leader" : user === "p" ? "pastor" : "branch_pastor" });
  });
  it("requires actual appointment/unit scope, not staff roles or client role claims", async () => {
    await expect(meetings.createSharedChurchMeeting("admin", meetingInput)).rejects.toThrow();
    await expect(meetings.createSharedChurchMeeting("outside", meetingInput)).rejects.toThrow();
    await expect(meetings.createSharedChurchMeeting("b", { ...meetingInput, unitId: 2 })).rejects.toThrow();
    expect(await meetings.listSharedChurchMeetings("outside", 1, "2026-10-13").catch(() => [])).toEqual([]);
  });
  it("checks each assigned branch and fails closed on a stale primary branch", async () => {
    await runtime.db.execute(sql`insert into church_branch_pastors values('b',2)`);
    expect((await meetings.listMeetingUnits("b")).map(row => row.id)).toEqual([1,2]);
    await meetings.createSharedChurchMeeting("b", { ...meetingInput, unitId: 2 });
    await runtime.db.execute(sql`delete from church_branch_pastors where user_id='b'`);
    await expect(meetings.createSharedChurchMeeting("b", meetingInput)).rejects.toThrow("not available");
  });
  it("organisational projections enforce the meeting's branch as well as the subject's assignment", async () => {
    await runtime.db.execute(sql`insert into users values('peer_b','Synthetic multi-branch peer'); insert into church_assignments(user_id,role,branch_id,unit_id,supervisor_id,assigned_by) values('peer_b','branch_pastor',1,null,'p','p'); insert into church_branch_pastors values('peer_b',1),('peer_b',2)`);
    const event = await meetings.createSharedChurchMeeting('peer_b', { ...meetingInput, unitId: 2 });
    expect((await meetings.getScopedSharedMeetingDetails('b','peer_b','2026-10-13')).get(event.activityId)).toBeNull();
    expect((await meetings.getScopedSharedMeetingDetails('p','peer_b','2026-10-13')).get(event.activityId)?.totalAttendance).toBe(12);
  });
  it("keeps explicit legacy contact deletion compatible without deleting a report", async () => {
    await runtime.db.execute(sql`insert into outreach_contacts(id,user_id,name) values(1,'w','Synthetic old contact')`);
    const report = await ministry.saveMinistryReportV3("w", { ...ministryInput, contacts: ['legacy:1'] });
    await runtime.db.execute(sql`delete from outreach_contacts where id=1`);
    expect((await ministry.getOwnMinistryReportV3("w", report.activityId))?.activity.followUps).toBe(3);
  });
  it("personal reports are idempotent and cannot overwrite shared totals/details or expose contacts", async () => {
    const meeting = await meetings.createSharedChurchMeeting("w", meetingInput);
    const ownContact = await contacts.createPrivateMinistryContact("w2", contactInput);
    const input = { meetingId: meeting.meetingId, participation: "disciple", attended: true, contacts: [ownContact.key], totalAttendance: 999, subject: "Overwrite" };
    const [a,b] = await Promise.all([meetings.saveSharedMeetingAttendance("w2", input), meetings.saveSharedMeetingAttendance("w2", input)]);
    expect(a.activityId).toBe(b.activityId);
    expect((await meetings.listSharedChurchMeetings("w", 1, "2026-10-13"))[0]).toMatchObject({ totalAttendance: 12, subject: "Synthetic teaching" });
    expect(JSON.stringify(await meetings.listSharedChurchMeetings("w", 1, "2026-10-13"))).not.toContain(ownContact.phone);
    await expect(meetings.saveSharedMeetingAttendance("outside", input)).rejects.toThrow();
    await expect(meetings.saveSharedMeetingAttendance("w2", { ...input, participation: "leader" })).rejects.toThrow();
  });
  it("disabled reads do not touch missing new tables; historical writes are refused", async () => {
    vi.stubEnv("DASHBOARD_REPORTING_V3", "0");
    vi.stubEnv("DASHBOARD_REPORTING_V3_SCHEMA", "0");
    await runtime.db.execute(sql`alter table private_ministry_contacts rename to unavailable_contacts`);
    try {
      expect(await contacts.listReportContactChoices("w")).toEqual([]);
      expect(await meetings.listSharedChurchMeetings("w", 1, "2026-10-13")).toEqual([]);
      await expect(ministry.saveMinistryReportV3("w", ministryInput)).rejects.toThrow("not enabled");
    } finally { await runtime.db.execute(sql`alter table unavailable_contacts rename to private_ministry_contacts`); }
    vi.stubEnv("DASHBOARD_REPORTING_V3", "1");
    vi.stubEnv("DASHBOARD_REPORTING_V3_SCHEMA", "1");
    await expect(ministry.saveMinistryReportV3("w", { ...ministryInput, dateKey: "2026-09-01" })).rejects.toThrow("view only");
  });
  it("write rollback keeps owned records readable and blocks legacy overwrite of new reports", async () => {
    const report = await ministry.saveMinistryReportV3("w", ministryInput);
    vi.stubEnv("DASHBOARD_REPORTING_V3", "0");
    expect(await ministry.getOwnMinistryReportV3("w", report.activityId)).not.toBeNull();
    const legacy = await import("@/app/(site)/dashboard/community/_actions/report-actions");
    const result = await legacy.saveMinistryActivity({ activityId: report.activityId, dateKey: "2026-10-13", kind: "follow_up", values: { followUps: "99" }, note: "", followUps: [] });
    expect(result.ok).toBe(false);
    expect((await ministry.getOwnMinistryReportV3("w", report.activityId))?.activity.followUps).toBe(3);
  });
});
