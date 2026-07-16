import { describe, expect, test } from "vitest";

import {
  buildBibleReadingProjection,
  getBibleTestament,
} from "./bible-reading";

describe("bible reading tracking", () => {
  test("classifies books by testament", () => {
    expect(getBibleTestament("Genesis")).toBe("Old Testament");
    expect(getBibleTestament("Matthew")).toBe("New Testament");
  });

  test("projects testament completion from current chapter and reading pace", () => {
    const projection = buildBibleReadingProjection({
      asOfDateKey: "2026-07-12",
      currentBook: "Matthew",
      currentChapter: 10,
      logs: [
        { dateKey: "2026-07-10", chaptersRead: 5 },
        { dateKey: "2026-07-11", chaptersRead: 5 },
        { dateKey: "2026-07-12", chaptersRead: 5 },
      ],
    });

    expect(projection).toEqual({
      testament: "New Testament",
      completionDateLabel: "August 31, 2026",
      footnote:
        "You're on track to complete the New Testament on August 31, 2026 at this pace.",
    });
  });
});
