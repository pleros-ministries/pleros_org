import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("SOGP week certificate wiring", () => {
  test("every write that can complete a week schedules a certificate check", () => {
    for (const file of [
      "app/api/sogp/course/day/[dayNumber]/quiz/route.ts",
      "app/api/sogp/course/day/[dayNumber]/response/route.ts",
      "app/api/sogp/prayer-watch/route.ts",
      "app/api/sogp/reviews/[liveClassId]/completion/route.ts",
      "app/_actions/prayer-watch-actions.ts",
      "app/admin/_actions/sogp-actions.ts",
    ]) {
      expect(source(file), file).toContain("scheduleSogpWeekCertificateCheck(");
    }
  });

  test("the SOGP dashboard awards from the journey it has already built", () => {
    const route = source("app/api/sogp/journey/route.ts");
    expect(route).toContain("getActiveSogpJourneyWithContext");
    expect(route).toContain("awardSogpWeekCertificates(loaded)");
    expect(route).toContain("after(() => sendSogpWeekCertificateNotices");
  });

  test("the shared journey loader stays read-only", () => {
    const journey = source("lib/db/queries/sogp-journey.ts");
    expect(journey).not.toContain("insert(schema.sogpWeekCertificates)");
    expect(journey).not.toContain("sogp-week-certificates");
  });

  test("migration 0050 adds the notification kind and one row per enrolment, cohort and week", () => {
    const migration = source("drizzle/0050_sogp_week_certificates.sql");
    expect(migration).toContain("ADD VALUE 'sogp_week_certificate'");
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "sogp_week_certificates_enrollment_cohort_week_idx" ON "sogp_week_certificates" USING btree ("enrollment_id","cohort_id","week")',
    );
  });
});
