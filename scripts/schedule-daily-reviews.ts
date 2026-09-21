import { inArray } from "drizzle-orm";

// Dynamic imports: tsx loads the static form as ESM and can't see the db module's named export.
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const { db } = await import("../lib/db");
  const schema = await import("../lib/db/schema");
  const { ensureDailyReviewSessions } = await import("../lib/db/queries/sogp-daily-reviews");
  const cohorts = await db
    .select()
    .from(schema.sogpCohorts)
    .where(inArray(schema.sogpCohorts.status, ["enrollment_open", "preparing", "active"]));

  for (const cohort of cohorts) {
    const result = await ensureDailyReviewSessions(cohort.id, { dryRun });
    console.log(
      `${dryRun ? "[dry run] would create" : "created"} ${result.created} daily review sessions for ${cohort.title}` +
        (dryRun ? "" : `; relinked ${result.relinked} to ${cohort.telegramChannelUrl ?? "(no Telegram URL)"}`),
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
