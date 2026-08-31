import { describe, expect, test } from "vitest";

import * as journey from "./journey";
import {
  getPreparationRequirements,
  getSogpDayRequirements,
} from "./journey";

describe("SOGP journey requirements", () => {
  test("requires the lesson and Prayer Watch during preparation", () => {
    expect(
      getPreparationRequirements({
        lessonComplete: true,
        prayerWatchComplete: false,
      }),
    ).toEqual([true, false]);
  });

  test("requires Prayer Watch and assessment on weekdays", () => {
    expect(
      getSogpDayRequirements({
        kind: "weekday",
        prayerWatchComplete: true,
        assessmentComplete: false,
      }),
    ).toEqual([true, false]);
  });

  test("requires only Prayer Watch on an ordinary weekend date", () => {
    expect(
      getSogpDayRequirements({
        kind: "weekend",
        prayerWatchComplete: true,
      }),
    ).toEqual([true]);
  });

  test("requires Prayer Watch and the review on a scheduled review date", () => {
    expect(
      getSogpDayRequirements({
        kind: "review",
        prayerWatchComplete: true,
        reviewComplete: false,
      }),
    ).toEqual([true, false]);
  });
});

test("classifies supported Pre-SOGP lesson media providers", () => {
  const classify = (journey as Record<string, unknown>)[
    "classifySogpLessonMediaUrl"
  ];

  expect(classify).toBeTypeOf("function");
  if (typeof classify !== "function") return;

  expect(classify("https://media.example.com/lesson.mp4")).toEqual({
    kind: "video",
    src: "https://media.example.com/lesson.mp4",
  });
  expect(
    classify("https://www.youtube.com/embed/8iZGdhWZr-s?rel=0"),
  ).toEqual({
    kind: "embed",
    src: "https://www.youtube.com/embed/8iZGdhWZr-s?rel=0",
  });
  expect(
    classify(
      "https://drive.google.com/file/d/111KUfwXwvnuOcK1X-IKlU7MH3e8Fn07n/preview",
    ),
  ).toEqual({
    kind: "embed",
    src: "https://drive.google.com/file/d/111KUfwXwvnuOcK1X-IKlU7MH3e8Fn07n/preview",
  });
  expect(classify("https://example.com/watch/lesson")).toEqual({
    kind: "external",
    src: "https://example.com/watch/lesson",
  });
});
