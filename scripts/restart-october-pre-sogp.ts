/**
 * One-off: restart the SOGP October 2026 cohort's Pre-SOGP on 2 October 2026
 * as Day 1, running 10 days (2–11 Oct, before core starts on 12 Oct) with the
 * Discipleship Foundations videos in order.
 *
 * Earlier preparation days are unpublished, not deleted, so learners keep
 * their completion history and leaderboard points. Dry run by default; pass
 * --apply to write. Safe to re-run.
 *
 *   node --env-file=.env --import tsx scripts/restart-october-pre-sogp.ts [--apply]
 *
 * Add --allow-replace to proceed when learners have already completed a
 * different video on one of the new dates (their completion then counts for
 * the Foundations video on that date).
 */
import { and, asc, eq, inArray, notInArray } from "drizzle-orm";

// Dynamic imports: tsx loads the static form as ESM and can't see local modules' named exports.
const COHORT_TITLE = "SOGP October 2026";
const START_DATE_KEY = "2026-10-02";
const apply = process.argv.includes("--apply");
const allowReplace = process.argv.includes("--allow-replace");

async function main() {
  const { discipleshipFoundationsVideos } = await import("../lib/discipleship-foundations-content");
  const { enumerateDateKeys } = await import("../lib/sogp/daily-participation");
  const { db } = await import("../lib/db");
  const { transactionDb } = await import("../lib/db/transaction");
  const schema = await import("../lib/db/schema");
  const TOTAL_DAYS = discipleshipFoundationsVideos.length;

  const [cohort] = await db
    .select()
    .from(schema.sogpCohorts)
    .where(eq(schema.sogpCohorts.title, COHORT_TITLE))
    .limit(1);
  if (!cohort) throw new Error(`${COHORT_TITLE} not found.`);

  const end = new Date(`${START_DATE_KEY}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + TOTAL_DAYS - 1);
  const dateKeys = enumerateDateKeys(START_DATE_KEY, end.toISOString().slice(0, 10));
  const coreStartKey = new Date(cohort.startsAt.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
  if (dateKeys.at(-1)! >= coreStartKey) {
    throw new Error(`Pre-SOGP would run into core SOGP (starts ${coreStartKey}).`);
  }

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
  console.log(`${cohort.title} (id ${cohort.id}): preparation starts ${cohort.preparationStartsAt?.toISOString() ?? "(unset)"}, core starts ${coreStartKey}`);
  printSchedule("Current schedule", before);

  // Completions already recorded on the new dates against a different video.
  const urlByDate = new Map(dateKeys.map((dateKey, index) => [dateKey, discipleshipFoundationsVideos[index]!.href]));
  const affectedDays = before.filter(
    ({ day, resource }) =>
      urlByDate.has(day.publishDate) && resource && resource.url !== urlByDate.get(day.publishDate),
  );
  if (affectedDays.length) {
    const completions = await db
      .select({ dayId: schema.sogpPreparationCompletions.preparationDayId })
      .from(schema.sogpPreparationCompletions)
      .where(inArray(schema.sogpPreparationCompletions.preparationDayId, affectedDays.map(({ day }) => day.id)));
    if (completions.length && !allowReplace) {
      throw new Error(
        `${completions.length} completion(s) exist on dates whose video will change. Re-run with --allow-replace to proceed.`,
      );
    }
    if (completions.length) console.log(`\nNote: ${completions.length} completion(s) will now count for the new video on those dates.`);
  }

  const toUnpublish = before.filter(({ day }) => day.status === "published" && !urlByDate.has(day.publishDate));
  console.log(`\nPlanned: preparation start → ${START_DATE_KEY}; ${TOTAL_DAYS} days ${dateKeys[0]} – ${dateKeys.at(-1)}:`);
  dateKeys.forEach((dateKey, index) => {
    console.log(`  ${dateKey}  Day ${index + 1} of ${TOTAL_DAYS}  ${discipleshipFoundationsVideos[index]!.title}`);
  });
  console.log(`Unpublish ${new Set(toUnpublish.map(({ day }) => day.id)).size} other day(s) (kept as drafts with their completions).`);

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write.");
    return;
  }

  await transactionDb.transaction(async (tx) => {
    await tx
      .update(schema.sogpPreparationDays)
      .set({ status: "draft", updatedAt: new Date() })
      .where(
        and(
          eq(schema.sogpPreparationDays.cohortId, cohort.id),
          notInArray(schema.sogpPreparationDays.publishDate, dateKeys),
        ),
      );

    for (const [index, dateKey] of dateKeys.entries()) {
      const video = discipleshipFoundationsVideos[index]!;
      const countdownLabel = `Day ${index + 1} of ${TOTAL_DAYS}`;
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

    await tx
      .update(schema.sogpCohorts)
      .set({ preparationStartsAt: new Date(`${START_DATE_KEY}T00:00:00+01:00`), updatedAt: new Date() })
      .where(eq(schema.sogpCohorts.id, cohort.id));
  });

  const after = await loadSchedule();
  printSchedule("Updated schedule", after);

  const published = after.filter(({ day }) => day.status === "published");
  const uniqueUrls = new Set(published.map(({ resource }) => resource?.url));
  const consecutive = published.map(({ day }) => day.publishDate).join() === dateKeys.join();
  console.log(
    `\nPost-check: ${published.length} published days (want ${TOTAL_DAYS}), ${uniqueUrls.size} unique URLs, consecutive ${dateKeys[0]}–${dateKeys.at(-1)}: ${consecutive ? "yes" : "NO"}`,
  );
  if (published.length !== TOTAL_DAYS || uniqueUrls.size !== TOTAL_DAYS || !consecutive) {
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
