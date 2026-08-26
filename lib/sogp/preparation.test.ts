import { describe, expect, test } from "vitest";

import { partitionSogpPreparationDays } from "./preparation";
import type { SogpPreparationDay } from "./types";

function day(
  id: number,
  publishDate: string,
  status: "draft" | "published" = "published",
): SogpPreparationDay {
  return {
    id,
    cohortId: 1,
    publishDate,
    countdownLabel: `${id} days until SOGP`,
    introduction: `Preparation ${id}`,
    status,
    resources: [],
  };
}

describe("SOGP preparation visibility", () => {
  test("uses the Lagos calendar and hides drafts and future days", () => {
    const result = partitionSogpPreparationDays(
      [
        day(1, "2026-08-25", "draft"),
        day(2, "2026-08-26"),
        day(3, "2026-08-27"),
        day(4, "2026-08-28"),
      ],
      new Date("2026-08-26T23:30:00.000Z"),
    );

    expect(result.today?.id).toBe(3);
    expect(result.previous.map((item) => item.id)).toEqual([2]);
  });

  test("keeps previous days available when today has no published entry", () => {
    const result = partitionSogpPreparationDays(
      [day(1, "2026-08-24"), day(2, "2026-08-25")],
      new Date("2026-08-26T12:00:00.000Z"),
    );

    expect(result.today).toBeNull();
    expect(result.previous.map((item) => item.id)).toEqual([2, 1]);
  });
});
