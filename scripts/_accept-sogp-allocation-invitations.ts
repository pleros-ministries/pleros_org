// One-off (user decision, 27 November): accepts, on each enrolee's behalf, the group invitation
// that _allocate-sogp-distribution.ts sent into their leader's default group, so they are
// members straight away. It goes through the app's own respondToInvitation, so the locked join
// rules still apply (group cap, no circular or own-group joins); anything refused is listed.
// Sharing their phone with the group follows their WhatsApp consent at enrolment.
// Accepting sends no notices. Re-running is safe: answered invitations are skipped.
// Run: npx tsx --env-file=.env scripts/_accept-sogp-allocation-invitations.ts [--dry-run]
import Module from "node:module";
import { and, eq, inArray } from "drizzle-orm";

// The app's queries import "server-only"; outside Next, use Next's own server-side copy.
const moduleWithResolve = Module as unknown as { _resolveFilename: (request: string, ...rest: unknown[]) => string };
const resolveFilename = moduleWithResolve._resolveFilename;
moduleWithResolve._resolveFilename = (request, ...rest) =>
  resolveFilename(request === "server-only" ? "next/dist/compiled/server-only/empty.js" : request, ...rest);

const dryRun = process.argv.includes("--dry-run");
/** Kept in the group they're already in, and never invited (user, 27 November). */
const SKIP_ENROLLMENT_IDS = new Set([90]);

async function main() {
  const { db } = await import("@/lib/db");
  const s = await import("@/lib/db/schema");
  const { respondToInvitation } = await import("@/lib/db/queries/sogp-group-invitations");
  const { distributionAssignments } = await import("@/lib/sogp/discipleship-distribution-draft");

  const pairs = distributionAssignments.map(([enrolee, leader]) => ({ enrolee, leader })).filter(p => !SKIP_ENROLLMENT_IDS.has(p.enrolee));
  const enrolments = new Map((await db
    .select({ id: s.sogpEnrollments.id, userId: s.sogpEnrollments.userId, whatsappConsent: s.sogpEnrollments.whatsappConsent })
    .from(s.sogpEnrollments).where(inArray(s.sogpEnrollments.id, [...new Set(pairs.flatMap(p => [p.enrolee, p.leader]))]))).map(r => [r.id, r]));

  const todo: { enrolee: number; invitationId: number; userId: string; sharesPhone: boolean }[] = [];
  const missing: number[] = [];
  for (const p of pairs) {
    const enrolee = enrolments.get(p.enrolee)!;
    const leader = enrolments.get(p.leader)!;
    const [invitation] = await db
      .select({ id: s.discipleshipGroupInvitations.id })
      .from(s.discipleshipGroupInvitations)
      .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipGroupInvitations.groupId))
      .where(and(
        eq(s.discipleshipGroupInvitations.recipientUserId, enrolee.userId),
        eq(s.discipleshipGroupInvitations.status, "pending"),
        eq(s.discipleshipGroups.leaderUserId, leader.userId),
        eq(s.discipleshipGroups.isDefault, true),
        eq(s.discipleshipGroups.status, "active"),
      ))
      .limit(1);
    if (invitation) todo.push({ enrolee: p.enrolee, invitationId: invitation.id, userId: enrolee.userId, sharesPhone: enrolee.whatsappConsent === true });
    else missing.push(p.enrolee);
  }
  console.log(`${dryRun ? "Would accept" : "Accepting"} ${todo.length} invitations; no pending invitation for ${missing.length}${missing.length ? ` (${missing.join(", ")})` : ""}.`);
  if (dryRun) return;

  let accepted = 0;
  const refused: string[] = [];
  for (const row of todo) {
    const result = await respondToInvitation({ userId: row.userId, invitationId: row.invitationId, accept: true, sharesPhone: row.sharesPhone });
    if (result.ok) accepted += 1;
    else refused.push(`${row.enrolee}: ${result.error}`);
  }
  console.log(`Accepted: ${accepted}. Refused: ${refused.length}${refused.length ? `\n  ${refused.join("\n  ")}` : ""}`);
}

main().then(() => process.exit(0), (error) => { console.error(error); process.exit(1); });
