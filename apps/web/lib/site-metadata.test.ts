import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

describe("site metadata", () => {
  test("uses the plural Pleros Ministries and Missions name", () => {
    const layoutSource = readFileSync(join(process.cwd(), "app", "layout.tsx"), "utf8");

    expect(layoutSource).toContain("Pleros Ministries and Missions");
    expect(layoutSource).not.toContain("Pleros Ministries and Mission –");
    expect(layoutSource).not.toContain("Pleros Ministries and Mission —");
  });
});
