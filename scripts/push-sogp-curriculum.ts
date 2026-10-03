import { and, eq, inArray } from "drizzle-orm";

// Script twin of the admin "Save curriculum" action (configureSogpCurriculum): schedules the
// chosen curriculum days for one cohort. Dry run by default.
//   node --env-file=.env --import tsx scripts/push-sogp-curriculum.ts --cohort=1 --orders=18 --apply
// Dynamic imports: tsx loads the static form as ESM and can't see the db module's named export.
const apply = process.argv.includes("--apply");

function argument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const { db } = await import("../lib/db");
  const { transactionDb } = await import("../lib/db/transaction");
  const schema = await import("../lib/db/schema");
  const { buildFirstCohortTrackSelection } = await import("../lib/sogp/first-cohort");
  const { assertMondayCohortStart, buildSogpTrackReleaseDates, resolveFirstReleaseAt } =
    await import("../lib/sogp/schedule");
  const { isSogpLessonContentReady } = await import("../lib/sogp/preparation-seed");

  const cohortId = Number(argument("cohort"));
  const orders = (argument("orders") ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
  if (!Number.isInteger(cohortId) || !orders.length) {
    throw new Error("Usage: --cohort=<cohort id> --orders=<day>[,<day>...] [--apply]");
  }

  const selection = buildFirstCohortTrackSelection().filter((track) =>
    orders.includes(track.curriculumOrder),
  );
  if (selection.length !== orders.length) {
    throw new Error(`Unknown curriculum day in --orders=${orders.join(",")}.`);
  }

  const [cohort] = await db
    .select()
    .from(schema.sogpCohorts)
    .where(eq(schema.sogpCohorts.id, cohortId));
  if (!cohort) throw new Error(`SOGP cohort ${cohortId} not found.`);

  const candidates = await db
    .select()
    .from(schema.lessons)
    .where(inArray(schema.lessons.levelId, [1, 2, 3]));
  const selectedLessons = selection.map((selected) => {
    const lesson = candidates.find(
      (candidate) =>
        candidate.levelId === selected.levelId &&
        candidate.lessonNumber === selected.lessonNumber,
    );
    if (!lesson) throw new Error(`Missing L${selected.levelId}.${selected.lessonNumber}.`);
    return { selected, lesson };
  });
  const quizRows = await db
    .select({ lessonId: schema.quizQuestions.lessonId })
    .from(schema.quizQuestions)
    .where(
      inArray(
        schema.quizQuestions.lessonId,
        selectedLessons.map(({ lesson }) => lesson.id),
      ),
    );
  const quizLessonIds = new Set(quizRows.map((row) => row.lessonId));
  const unready = selectedLessons.filter(
    ({ lesson }) => !isSogpLessonContentReady({ ...lesson, hasQuiz: quizLessonIds.has(lesson.id) }),
  );
  if (unready.length) {
    throw new Error(
      `Content not ready: ${unready.map(({ lesson }) => `L${lesson.levelId}.${lesson.lessonNumber} ${lesson.title}`).join(", ")}`,
    );
  }

  const firstRelease = resolveFirstReleaseAt(new Date(cohort.startsAt));
  assertMondayCohortStart(firstRelease);
  const releaseDates = buildSogpTrackReleaseDates(firstRelease);
  const existing = await db
    .select()
    .from(schema.sogpCohortTracks)
    .where(
      and(
        eq(schema.sogpCohortTracks.cohortId, cohortId),
        inArray(schema.sogpCohortTracks.curriculumOrder, orders),
      ),
    );

  console.log(`${cohort.title} (id ${cohort.id})`);
  for (const { selected, lesson } of selectedLessons) {
    const current = existing.find((row) => row.curriculumOrder === selected.curriculumOrder);
    console.log(
      `  day ${selected.dayNumber} (week ${selected.weekNumber}, level ${selected.curriculumLevel}) ` +
        `-> lesson ${lesson.id} "${lesson.title}", releases ${releaseDates[selected.curriculumOrder - 1]!.toISOString()} ` +
        `[${current ? `replaces schedule row ${current.id}` : "new schedule row"}]`,
    );
  }

  if (!apply) {
    console.log("[dry run] no changes written; re-run with --apply.");
    return;
  }

  await transactionDb.transaction(async (tx) => {
    await tx
      .delete(schema.sogpCohortTracks)
      .where(
        and(
          eq(schema.sogpCohortTracks.cohortId, cohortId),
          inArray(schema.sogpCohortTracks.curriculumOrder, orders),
        ),
      );
    await tx.insert(schema.sogpCohortTracks).values(
      selectedLessons.map(({ selected, lesson }) => ({
        cohortId,
        lessonId: lesson.id,
        dayNumber: selected.dayNumber,
        weekNumber: selected.weekNumber,
        curriculumLevel: selected.curriculumLevel,
        curriculumOrder: selected.curriculumOrder,
        isRequired: selected.isRequired,
        liveSessionNumber: selected.liveSessionNumber,
        releaseAt: releaseDates[selected.curriculumOrder - 1]!,
      })),
    );
  });

  console.log(`Scheduled ${selection.length} day(s) for ${cohort.title}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
