/**
 * One-off: the SOGP October 2026 cohort switches to the Discipleship
 * Foundations videos from Pre-SOGP Day 11 and runs 20 preparation days
 * (21 Sep – 10 Oct) instead of 14. Days 1–10 are left untouched.
 *
 * Dry run by default; pass --apply to write. Safe to re-run.
 *
 *   node --env-file=.env --import tsx scripts/extend-october-pre-sogp.ts [--apply]
 */
import { and, asc, eq, inArray } from "drizzle-orm";

import { discipleshipFoundationsVideos } from "../lib/discipleship-foundations-content";
import { db } from "../lib/db";
import { transactionDb } from "../lib/db/transaction";
import * as schema from "../lib/db/schema";
import { enumerateDateKeys } from "../lib/sogp/daily-participation";

const COHORT_TITLE = "SOGP October 2026";
const FIRST_FOUNDATIONS_DAY = 11;
const TOTAL_DAYS = 20;
const apply = process.argv.includes("--apply");

const [cohort] = await db
  .select()
  .from(schema.sogpCohorts)
  .where(eq(schema.sogpCohorts.title, COHORT_TITLE))
  .limit(1);
if (!cohort) throw new Error(`${COHORT_TITLE} not found.`);

async function loadSchedule() {
  return db
    .select({ day: schema.sogpPreparationDays, resource: schema.sogpPreparationResources })
    .from(schema.sogpPreparationDays)
    .leftJoin(
      schema.sogpPreparationResources,
      eq(schema.sogpPreparationResources.preparationDayId, schema.sogpPreparationDays.id),
    )
    .where(eq(schema.sogpPreparationDays.cohortId, cohort!.id))
    .orderBy(asc(schema.sogpPreparationDays.publishDate), asc(schema.sogpPreparationResources.sortOrder));
}

function printSchedule(label: string, rows: Awaited<ReturnType<typeof loadSchedule>>) {
  console.log(`\n${label}`);
  for (const { day, resource } of rows) {
    console.log(`  ${day.publishDate}  ${day.countdownLabel.padEnd(13)} ${day.status.padEnd(9)} ${resource?.title ?? "(no resource)"}`);
  }
}

const before = await loadSchedule();
printSchedule(`Current schedule for ${cohort.title} (id ${cohort.id})`, before);

const firstDateKey = before[0]?.day.publishDate;
if (!firstDateKey) throw new Error("Cohort has no preparation days.");
const lastDateKey = (() => {
  const date = new Date(`${firstDateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + TOTAL_DAYS - 1);
  return date.toISOString().slice(0, 10);
})();
const dateKeys = enumerateDateKeys(firstDateKey, lastDateKey);

// Days FIRST_FOUNDATIONS_DAY..TOTAL_DAYS get the ten Foundations videos in order.
const foundationsDates = dateKeys.slice(FIRST_FOUNDATIONS_DAY - 1);
if (foundationsDates.length !== discipleshipFoundationsVideos.length) {
  throw new Error("Foundations videos don't match the remaining day count.");
}

// Never swap a video under a learner who already completed that day.
const existingTargetDayIds = before
  .filter(({ day }) => foundationsDates.includes(day.publishDate))
  .map(({ day }) => day.id);
if (existingTargetDayIds.length) {
  const completions = await db
    .select({ dayId: schema.sogpPreparationCompletions.preparationDayId, url: schema.sogpPreparationResources.url })
    .from(schema.sogpPreparationCompletions)
    .innerJoin(
      schema.sogpPreparationResources,
      eq(schema.sogpPreparationResources.preparationDayId, schema.sogpPreparationCompletions.preparationDayId),
    )
    .where(inArray(schema.sogpPreparationCompletions.preparationDayId, existingTargetDayIds));
  const foundationUrls = new Set(discipleshipFoundationsVideos.map((video) => video.href));
  const conflicting = completions.filter((row) => !foundationUrls.has(row.url));
  if (conflicting.length) {
    throw new Error(
      `${conflicting.length} learner completion(s) already exist on days being replaced (day ids ${[
        ...new Set(conflicting.map((row) => row.dayId)),
      ].join(", ")}). Aborting.`,
    );
  }
}

console.log(`\nPlanned: Days ${FIRST_FOUNDATIONS_DAY}–${TOTAL_DAYS} → Discipleship Foundations; all days relabelled "Day N of ${TOTAL_DAYS}".`);
foundationsDates.forEach((dateKey, index) => {
  console.log(`  ${dateKey}  Day ${FIRST_FOUNDATIONS_DAY + index} of ${TOTAL_DAYS}  ${discipleshipFoundationsVideos[index]!.title}`);
});

if (!apply) {
  console.log("\nDry run only. Re-run with --apply to write.");
  process.exit(0);
}

await transactionDb.transaction(async (tx) => {
  for (const [index, dateKey] of dateKeys.entries()) {
    const countdownLabel = `Day ${index + 1} of ${TOTAL_DAYS}`;
    const video = index + 1 >= FIRST_FOUNDATIONS_DAY
      ? discipleshipFoundationsVideos[index + 1 - FIRST_FOUNDATIONS_DAY]!
      : null;

    if (!video) {
      await tx
        .update(schema.sogpPreparationDays)
        .set({ countdownLabel, updatedAt: new Date() })
        .where(
          and(
            eq(schema.sogpPreparationDays.cohortId, cohort.id),
            eq(schema.sogpPreparationDays.publishDate, dateKey),
          ),
        );
      continue;
    }

    const [day] = await tx
      .insert(schema.sogpPreparationDays)
      .values({
        cohortId: cohort.id,
        publishDate: dateKey,
        countdownLabel,
        introduction: video.description,
        status: "published",
      })
      .onConflictDoUpdate({
        target: [schema.sogpPreparationDays.cohortId, schema.sogpPreparationDays.publishDate],
        set: { countdownLabel, introduction: video.description, status: "published", updatedAt: new Date() },
      })
      .returning({ id: schema.sogpPreparationDays.id });
    if (!day) throw new Error(`Could not save ${dateKey}.`);

    await tx
      .delete(schema.sogpPreparationResources)
      .where(eq(schema.sogpPreparationResources.preparationDayId, day.id));
    await tx.insert(schema.sogpPreparationResources).values({
      preparationDayId: day.id,
      type: "video",
      title: video.title,
      description: video.description,
      url: video.href,
      sortOrder: 0,
    });
  }
});

const after = await loadSchedule();
printSchedule("Updated schedule", after);

const published = after.filter(({ day }) => day.status === "published");
const uniqueUrls = new Set(published.map(({ resource }) => resource?.url));
const consecutive = published.map(({ day }) => day.publishDate).join() === dateKeys.join();
console.log(
  `\nPost-check: ${published.length} published days (want ${TOTAL_DAYS}), ${uniqueUrls.size} unique URLs, consecutive ${firstDateKey}–${lastDateKey}: ${consecutive ? "yes" : "NO"}`,
);
if (published.length !== TOTAL_DAYS || uniqueUrls.size !== TOTAL_DAYS || !consecutive) {
  process.exitCode = 1;
}
