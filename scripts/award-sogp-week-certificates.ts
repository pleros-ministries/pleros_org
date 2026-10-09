import { asc, eq, lte } from "drizzle-orm";

/**
 * Silently awards SOGP week certificates to learners who already qualify
 * (no notification, push or email). Dry run by default.
 *
 *   node --env-file=.env --import tsx scripts/award-sogp-week-certificates.ts [--cohort=<id>] [--apply]
 *
 * Without --cohort it covers every cohort that has started, chosen by date
 * rather than status. A learner is only checked through their newest
 * enrolment, which is the one the dashboard awards from.
 */

// Dynamic imports: tsx loads the static form as ESM and can't see the db module's named export.
const apply = process.argv.includes("--apply");
const cohortArg = process.argv.find((arg) => arg.startsWith("--cohort="));
const cohortId = cohortArg ? Number(cohortArg.slice("--cohort=".length)) : null;

async function main() {
  if (cohortArg && !Number.isInteger(cohortId)) {
    throw new Error("--cohort must be a cohort id, e.g. --cohort=3");
  }
  const { db } = await import("../lib/db");
  const schema = await import("../lib/db/schema");
  const { getActiveSogpJourneyWithContext } = await import("../lib/db/queries/sogp-journey");
  const { awardSogpWeekCertificates } = await import("../lib/db/queries/sogp-week-certificates");
  const { formatSogpWeekList, selectWeeksToAward } = await import("../lib/sogp/week-certificates");

  const now = new Date();
  const cohorts = await db
    .select({ id: schema.sogpCohorts.id, title: schema.sogpCohorts.title })
    .from(schema.sogpCohorts)
    .where(
      cohortId !== null
        ? eq(schema.sogpCohorts.id, cohortId)
        : lte(schema.sogpCohorts.startsAt, now),
    )
    .orderBy(asc(schema.sogpCohorts.startsAt));
  if (cohorts.length === 0) {
    console.log("No matching cohorts.");
    return;
  }

  const totals = new Map<number, number>();
  let learners = 0;
  let skipped = 0;

  for (const cohort of cohorts) {
    console.log(`\n${cohort.title} (cohort ${cohort.id})`);
    const enrollments = await db
      .select({
        id: schema.sogpEnrollments.id,
        userId: schema.sogpEnrollments.userId,
        firstName: schema.sogpEnrollments.firstName,
        status: schema.sogpEnrollments.status,
      })
      .from(schema.sogpEnrollments)
      .where(eq(schema.sogpEnrollments.cohortId, cohort.id))
      .orderBy(asc(schema.sogpEnrollments.id));

    for (const enrollment of enrollments) {
      if (enrollment.status === "withdrawn") continue;
      const loaded = await getActiveSogpJourneyWithContext(enrollment.userId, now);
      if (!loaded || loaded.context.enrollmentId !== enrollment.id) {
        skipped += 1;
        console.log(`  skip enrolment ${enrollment.id}: not the learner's newest enrolment`);
        continue;
      }
      const due = selectWeeksToAward({
        summaries: loaded.journey.certificates.weeks,
        existingWeeks: loaded.context.existingWeeks,
        enrollmentStatus: loaded.context.enrollmentStatus,
      });
      if (due.length === 0) continue;

      const weeks = apply
        ? (await awardSogpWeekCertificates(loaded)).awarded.map((item) => item.week)
        : due;
      if (weeks.length === 0) continue;
      learners += 1;
      for (const week of weeks) totals.set(week, (totals.get(week) ?? 0) + 1);
      console.log(
        `  ${apply ? "awarded" : "would award"} enrolment ${enrollment.id} (${enrollment.firstName || "learner"}): Week ${formatSogpWeekList(weeks)}`,
      );
    }
  }

  console.log(`\n${apply ? "Awarded" : "[dry run] Would award"} certificates to ${learners} learner(s); skipped ${skipped}.`);
  for (const week of [1, 2, 3, 4]) {
    console.log(`  Week ${week}: ${totals.get(week) ?? 0}`);
  }
  if (!apply) console.log("\nRe-run with --apply to award them. No notices are sent either way.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
