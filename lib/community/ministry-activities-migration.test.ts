import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const migrationPath = join(process.cwd(), "drizzle", "0046_ministry_activities.sql");

describe("the ministry activities migration", () => {
  const migration = readFileSync(migrationPath, "utf8");

  test("creates the activity log, the interaction history and the contact statuses", () => {
    for (const type of [
      "ministry_activity_kind",
      "outreach_mode",
      "contact_salvation_status",
      "contact_discipleship_status",
      "contact_interaction_kind",
    ]) {
      expect(migration).toContain(`CREATE TYPE "public"."${type}"`);
    }
    expect(migration).toContain('CREATE TABLE "ministry_activities"');
    expect(migration).toContain('CREATE TABLE "outreach_contact_interactions"');
    for (const column of [
      "activity_id",
      "salvation_status",
      "discipleship_status",
      "follow_up_plan",
      "next_follow_up_date",
    ]) {
      expect(migration).toContain(`ALTER TABLE "outreach_contacts" ADD COLUMN "${column}"`);
    }
    expect(migration).toContain('WHERE "outreach_contact_interactions"."activity_id" IS NOT NULL');
  });

  test("copies every daily report into an outreach activity and checks nothing was left", () => {
    expect(migration).toContain('FROM "ministry_reports" AS r');
    expect(migration).toContain('END::"public"."outreach_mode"');
    expect(migration).toContain("Ministry activities migration left % reports uncopied");
    expect(migration).not.toContain('DROP TABLE "ministry_reports"');
  });

  test("backfills each person's history from the old follow-up tick", () => {
    expect(migration).toContain("AT TIME ZONE 'Africa/Lagos'");
    expect(migration).toContain("'met'");
    expect(migration).toContain("'follow_up'");
    expect(migration).toContain('SET "activity_id" = a."id"');
  });

  test("runs the data statements after the schema statements", () => {
    const lastIndex = migration.lastIndexOf("CREATE INDEX");
    const firstCopy = migration.indexOf('INSERT INTO "ministry_activities"');
    expect(firstCopy).toBeGreaterThan(lastIndex);
  });

  test("is registered after migration 0045", () => {
    const journal = JSON.parse(
      readFileSync(join(process.cwd(), "drizzle", "meta", "_journal.json"), "utf8"),
    ) as { entries: Array<{ idx: number; tag: string }> };

    expect(journal.entries).toContainEqual(
      expect.objectContaining({ idx: 46, tag: "0046_ministry_activities" }),
    );
  });
});
