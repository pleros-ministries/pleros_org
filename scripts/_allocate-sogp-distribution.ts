// One-off: applies the reviewed SOGP distribution (lib/sogp/discipleship-distribution-draft.ts).
// For each enrolee it does what the app does when follow-up changes hands:
//   1. the leader becomes the follow-up owner (pastor_assignments), recording the previous owner;
//   2. the enrolee is invited into the leader's default group (inviteIntoOwnersGroup), which
//      withdraws an earlier owner's pending follow-up invitation and sends the invitation notice;
//   3. the enrolee whose owner changed is told "{leader} will look after you now", and each
//      leader gets one "handed over to you" notice.
// Enrolees join a group only when they accept. Other pending invitations are left alone.
// Re-running is safe: owners already set and invitations already sent are skipped.
// Run: npx tsx --conditions=react-server --env-file=.env scripts/_allocate-sogp-distribution.ts [--dry-run]
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";

// The app's queries import "server-only", which Next resolves at build time. Outside Next,
// point it at Next's own server-side copy, which does nothing.
const moduleWithResolve = Module as unknown as { _resolveFilename: (request: string, ...rest: unknown[]) => string };
const resolveFilename = moduleWithResolve._resolveFilename;
moduleWithResolve._resolveFilename = (request, ...rest) =>
  resolveFilename(request === "server-only" ? "next/dist/compiled/server-only/empty.js" : request, ...rest);

const dryRun = process.argv.includes("--dry-run");
/** The admin applying it (Daniel Adeyemo's enrolment). */
const ACTOR_ENROLLMENT_ID = 25;
/** Kept in the group they're already in (user, 27 November). */
const SKIP_ENROLLMENT_IDS = new Set([90]);
const firstName = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || "Someone";

async function main() {
  // Imported here, as in the other scripts, so tsx resolves the app's modules after the env is loaded.
  const { notify } = await import("@/lib/community/notify");
  const { db } = await import("@/lib/db");
  const { inviteIntoOwnersGroup } = await import("@/lib/db/queries/follow-up-group-invites");
  const s = await import("@/lib/db/schema");
  const { distributionAssignments } = await import("@/lib/sogp/discipleship-distribution-draft");
  const pairs = distributionAssignments.map(([enrolee, leader]) => ({ enrolee, leader })).filter(p => !SKIP_ENROLLMENT_IDS.has(p.enrolee));
  const ids = [...new Set(pairs.flatMap(p => [p.enrolee, p.leader, ACTOR_ENROLLMENT_ID]))];
  const people = new Map((await db
    .select({ id: s.sogpEnrollments.id, userId: s.sogpEnrollments.userId, name: s.sogpEnrollments.name, status: s.sogpEnrollments.status })
    .from(s.sogpEnrollments).where(inArray(s.sogpEnrollments.id, ids))).map(row => [row.id, row]));
  const owners = new Map((await db
    .select({ enrollmentId: s.pastorAssignments.enrollmentId, pastorUserId: s.pastorAssignments.pastorUserId })
    .from(s.pastorAssignments).where(inArray(s.pastorAssignments.enrollmentId, pairs.map(p => p.enrolee)))).map(row => [row.enrollmentId, row.pastorUserId]));
  const actor = people.get(ACTOR_ENROLLMENT_ID)!;

  const plan = pairs.map(p => {
    const enrolee = people.get(p.enrolee);
    const leader = people.get(p.leader);
    if (!enrolee || !leader || enrolee.status !== "enrolled") throw new Error(`Enrolment ${p.enrolee} or leader ${p.leader} is missing or not enrolled`);
    const previousOwner = owners.get(p.enrolee) ?? null;
    return { ...p, enrolee, leader, previousOwner, ownerChanges: previousOwner !== leader.userId };
  });

  const byLeader = new Map<number, { name: string; enrolees: number; ownerChanges: number }>();
  for (const row of plan) {
    const entry = byLeader.get(row.leader.id) ?? { name: row.leader.name.trim(), enrolees: 0, ownerChanges: 0 };
    entry.enrolees += 1;
    if (row.ownerChanges) entry.ownerChanges += 1;
    byLeader.set(row.leader.id, entry);
  }
  console.log(`${dryRun ? "Would allocate" : "Allocating"} ${plan.length} enrolees to ${byLeader.size} leaders; follow-up owner changes: ${plan.filter(r => r.ownerChanges).length}.`);

  const logDir = path.join(process.cwd(), "tmp");
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `sogp-allocation-${dryRun ? "dry-run" : "applied"}.json`);
  fs.writeFileSync(logPath, JSON.stringify(plan.map(r => ({ enrollmentId: r.enrolee.id, leaderEnrollmentId: r.leader.id, previousOwnerUserId: r.previousOwner, ownerChanges: r.ownerChanges })), null, 2));
  console.log(`Plan written to ${logPath} (previous owners kept for undo).`);
  if (dryRun) return;

  // 1. Follow-up owners, in one transaction.
  const changing = plan.filter(r => r.ownerChanges);
  await db.transaction(async tx => {
    for (const row of changing) {
      await tx.insert(s.pastorAssignments)
        .values({ enrollmentId: row.enrolee.id, pastorUserId: row.leader.userId, assignedBy: actor.userId })
        .onConflictDoUpdate({ target: s.pastorAssignments.enrollmentId, set: { pastorUserId: row.leader.userId, assignedBy: actor.userId, assignedAt: new Date() } });
    }
  });
  console.log(`Follow-up owners set: ${changing.length}.`);

  // 2. Group invitations (the invitation notice and push come with each one).
  let invited = 0;
  const failed: number[] = [];
  for (const row of plan) {
    try { if (await inviteIntoOwnersGroup({ enrollmentId: row.enrolee.id, ownerUserId: row.leader.userId, invitedBy: row.leader.userId })) invited += 1; }
    catch (error) { failed.push(row.enrolee.id); console.error(`Invitation for ${row.enrolee.id} failed`, error); }
  }
  console.log(`Invitations sent: ${invited}. Failed: ${failed.length ? failed.join(", ") : "none"}.`);

  // 3. Names-only handover notices, as the app's own handover sends them.
  const fromName = firstName(actor.name);
  for (const row of changing) {
    await notify({
      userIds: [row.enrolee.userId], kind: "follow_up_changed",
      payload: { ownerName: firstName(row.leader.name) },
      pushBody: `${firstName(row.leader.name)} will look after you now.`,
      pushUrl: "/dashboard/sogp/follow-up/welcome",
    }).catch(error => console.error(`Follow-up notice for ${row.enrolee.id} failed`, error));
  }
  for (const [leaderId, entry] of byLeader) {
    if (!entry.ownerChanges) continue;
    const leader = people.get(leaderId)!;
    await notify({
      userIds: [leader.userId], kind: "enrollee_handed_over",
      payload: { fromName, enrolleeName: `${entry.ownerChanges} people`, enrollmentId: null },
      pushBody: `${fromName} handed ${entry.ownerChanges} people over to you.`,
      pushUrl: "/dashboard/community/enrollees",
      exclude: actor.userId,
    }).catch(error => console.error(`Handover notice for leader ${leaderId} failed`, error));
  }
  console.log("Notices sent.");

  const [check] = await db.select({ n: s.pastorAssignments.id }).from(s.pastorAssignments)
    .where(and(eq(s.pastorAssignments.enrollmentId, plan[0]!.enrolee.id), eq(s.pastorAssignments.pastorUserId, plan[0]!.leader.userId))).limit(1);
  console.log(check ? "Spot check passed." : "Spot check FAILED.");
}

main().then(() => process.exit(0), (error) => { console.error(error); process.exit(1); });
