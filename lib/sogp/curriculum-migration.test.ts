import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const migrationPath = join(
  process.cwd(),
  "drizzle",
  "0016_sogp_four_level_curriculum.sql",
);

describe("the four-level curriculum migration", () => {
  test("guards and renames the nine practical source lessons", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("SOGP curriculum migration expected 9 Level 3 lessons");
    expect(migration).toContain("Baptism of the Holy Ghost");
    expect(migration).toContain("Discipline – The Foundation of the Pursuit of Purpose");
    expect(migration).toContain("The Walk of Faith");
    expect(migration).toContain("The Life of Prayer");
    expect(migration).toContain("Believer’s Authority");
    expect(migration).toContain("Healing in the Newness of Life");
    expect(migration).toContain("Natural Assignment in the Newness of Life");
    expect(migration).toContain("Spiritual Assignment in the Newness of Life");
    expect(migration).toContain("Supernatural in the Newness of Life");
    expect(migration).toContain('WHERE "level_id" = 3');
  });

  test("is registered after migration 0015", () => {
    const journal = JSON.parse(
      readFileSync(join(process.cwd(), "drizzle", "meta", "_journal.json"), "utf8"),
    ) as { entries: Array<{ idx: number; tag: string }> };

    expect(journal.entries.at(-1)).toMatchObject({
      idx: 16,
      tag: "0016_sogp_four_level_curriculum",
    });
  });
});
