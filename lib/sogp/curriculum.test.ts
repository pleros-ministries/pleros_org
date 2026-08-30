import { describe, expect, test } from "vitest";

import {
  SOGP_LEVELS,
  SOGP_TRACKS,
  getSogpLevel,
  validateSogpCurriculum,
} from "./curriculum";

describe("canonical SOGP curriculum", () => {
  test("defines four levels of six required tracks", () => {
    expect(SOGP_LEVELS.map((level) => level.tracks.length)).toEqual([
      6, 6, 6, 6,
    ]);
    expect(SOGP_TRACKS).toHaveLength(24);
    expect(SOGP_TRACKS.every((track) => track.isRequired)).toBe(true);
    expect(
      new Set(
        SOGP_TRACKS.map(
          (track) => `${track.sourceLevelId}.${track.sourceLessonNumber}`,
        ),
      ).size,
    ).toBe(24);
  });

  test("ends Level 1 with Baptism and Level 3 with The Walk of Faith", () => {
    expect(SOGP_TRACKS[5]).toMatchObject({
      curriculumLevel: 1,
      curriculumOrder: 6,
      levelPosition: 6,
      sourceLevelId: 3,
      sourceLessonNumber: 1,
      title: "Baptism of the Holy Ghost",
    });
    expect(SOGP_TRACKS[17]).toMatchObject({
      curriculumLevel: 3,
      curriculumOrder: 18,
      levelPosition: 6,
      sourceLevelId: 3,
      sourceLessonNumber: 3,
      title: "The Walk of Faith",
    });
  });

  test("splits PPC Level 2 as six tracks then five tracks", () => {
    expect(
      getSogpLevel(2).tracks.map(
        (track) => `${track.sourceLevelId}.${track.sourceLessonNumber}`,
      ),
    ).toEqual(["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"]);
    expect(
      getSogpLevel(3).tracks.slice(0, 5).map(
        (track) => `${track.sourceLevelId}.${track.sourceLessonNumber}`,
      ),
    ).toEqual(["2.7", "2.8", "2.9", "2.10", "2.11"]);
  });

  test("validates unique positions and source coordinates", () => {
    expect(validateSogpCurriculum(SOGP_TRACKS)).toEqual([]);
    expect(
      validateSogpCurriculum([...SOGP_TRACKS, SOGP_TRACKS[0]!]),
    ).toEqual([
      "SOGP curriculum must contain exactly 24 tracks.",
      "SOGP curriculum source coordinates must be unique.",
      "SOGP curriculum positions must be unique.",
    ]);
  });
});
