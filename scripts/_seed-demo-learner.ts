// Demo seed: one fresh SOGP enrolee who hasn't chosen a learning path yet,
// for walking through or recording onboarding on the You dashboard.
// It uses the app's own account and enrolment code but skips every
// post-enrolment side effect (welcome email, Telegram alert, follow-up and
// pastor routing, referral attribution, group invites).
// The sign-in details go to tmp/demo-learner.txt (gitignored), never to chat.
// Run:  npx tsx --env-file=.env scripts/_seed-demo-learner.ts
// Undo: npx tsx --env-file=.env scripts/_wipe-demo-learner.ts
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, asc, eq, gt, inArray, isNull, or } from "drizzle-orm";

const DEMO_LEARNER_EMAIL = "demo.learner@pleros.test";

async function main() {
// Imported here so tsx resolves the app's modules after the env is loaded.
const { db } = await import("@/lib/db");
const { user: authUser } = await import("@/lib/db/auth-schema");
const schema = await import("@/lib/db/schema");
const { DEFAULT_DISCIPLESHIP_GROUP_NAME, generateInviteCode } = await import("@/lib/sogp/discipleship");
const { ensureSogpAuthUser, replaceSogpCredentialPassword } = await import("@/lib/sogp/enrollment-auth");
const { ensureAppUserRecord } = await import("@/lib/app-user");
// Same rule as getOpenSogpCohort (lib/db/queries/sogp.ts, which is server-only).
const [cohort] = await db.select().from(schema.sogpCohorts)
  .where(and(
    inArray(schema.sogpCohorts.status, ["enrollment_open", "preparing"]),
    or(isNull(schema.sogpCohorts.enrollmentClosesAt), gt(schema.sogpCohorts.enrollmentClosesAt, new Date())),
  ))
  .orderBy(asc(schema.sogpCohorts.startsAt)).limit(1);
if (!cohort) throw new Error("No cohort is open for enrolment.");

const user = await ensureSogpAuthUser({ email: DEMO_LEARNER_EMAIL, name: "Demo Learner" });
// Sign-in requires a verified email; the real flow verifies it with a code.
await db.update(authUser).set({ emailVerified: true }).where(eq(authUser.id, user.id));
const password = `Demo-${randomBytes(9).toString("base64url")}`;
await replaceSogpCredentialPassword(user.id, password);
// The app's own users row, which sign-in would otherwise create on first visit; enrolments point at it.
await ensureAppUserRecord({ id: user.id, name: "Demo Learner", email: DEMO_LEARNER_EMAIL, emailVerified: true });

// Same row upsertSogpEnrollment writes, plus the default group every enrolment gets.
const [enrollment] = await db.insert(schema.sogpEnrollments).values({
  cohortId: cohort.id,
  userId: user.id,
  firstName: "Demo",
  lastName: "Learner",
  name: "Demo Learner",
  email: DEMO_LEARNER_EMAIL,
  phone: "",
  countryCode: "GB",
  country: "United Kingdom",
  region: "",
  birthYear: null,
  referralSource: "Other: demo account",
  whatsappConsent: false,
  updatedAt: new Date(),
}).onConflictDoUpdate({ target: [schema.sogpEnrollments.cohortId, schema.sogpEnrollments.userId], set: { updatedAt: new Date() } }).returning();
const [group] = await db.select({ id: schema.discipleshipGroups.id }).from(schema.discipleshipGroups)
  .where(and(eq(schema.discipleshipGroups.leaderEnrollmentId, enrollment.id), eq(schema.discipleshipGroups.isDefault, true))).limit(1);
if (!group) await db.insert(schema.discipleshipGroups).values({ leaderEnrollmentId: enrollment.id, name: DEFAULT_DISCIPLESHIP_GROUP_NAME, inviteCode: generateInviteCode(), isDefault: true });

const out = path.join(process.cwd(), "tmp", "demo-learner.txt");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `Demo learner (fresh enrolee, no learning path yet)\nEmail: ${DEMO_LEARNER_EMAIL}\nPassword: ${password}\nCohort: ${cohort.title}\nRemove with: npx tsx --env-file=.env scripts/_wipe-demo-learner.ts\n`);
console.log(`Seeded demo learner in ${cohort.title} (enrolment ${enrollment.id}). Sign-in details: tmp/demo-learner.txt`);
}

main().then(() => process.exit(0), (error) => { console.error(error); process.exit(1); });
