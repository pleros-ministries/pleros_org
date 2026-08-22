import { describe, expect, test } from "vitest";

import {
  buildPpcLessonAudioUpdates,
  getPpcLessonReleaseStatusUpdates,
  extractTeachingLessonNumber,
} from "./ppc-teaching-sync";

describe("ppc teaching sync helpers", () => {
  test("extracts leading lesson numbers from teaching filenames", () => {
    expect(extractTeachingLessonNumber("1. Gospel - The Word of Truth - 4 Jan 2025.mp3")).toBe(1);
    expect(extractTeachingLessonNumber("3_The_New_Creation_Who_You_Are_in_Christ_30_Dec_2025_1.mp3")).toBe(3);
    expect(extractTeachingLessonNumber("11. The New Creation - 25 Jan, 2025.mp3")).toBe(11);
    expect(extractTeachingLessonNumber("Teaching without number.mp3")).toBeNull();
  });

  test("builds lesson audio updates by matching manifest files to lesson numbers", () => {
    const updates = buildPpcLessonAudioUpdates(
      [
        {
          name: "2. God's Purpose - Why We Exist - 30 Dec 2025.mp3",
          key: "key_2",
          url: "https://cdn.example.com/2.mp3",
          size: 222,
          uploadedAt: "2026-06-09T17:32:18.000Z",
        },
        {
          name: "1. Gospel - The Word of Truth - 4 Jan 2025.mp3",
          key: "key_1",
          url: "https://cdn.example.com/1.mp3",
          size: 111,
          uploadedAt: "2026-06-09T17:31:49.000Z",
        },
      ],
      [
        { id: 47, lessonNumber: 1, title: "Gospel: The Word of Truth" },
        { id: 48, lessonNumber: 2, title: "God's Purpose: Why We Exist" },
      ],
    );

    expect(updates).toEqual([
      {
        id: 47,
        lessonNumber: 1,
        title: "Gospel: The Word of Truth",
        audioUrl: "https://cdn.example.com/1.mp3",
        audioUploadKey: "key_1",
        audioFileName: "1. Gospel - The Word of Truth - 4 Jan 2025.mp3",
        audioFileSize: 111,
        audioUploadedAt: new Date("2026-06-09T17:31:49.000Z"),
      },
      {
        id: 48,
        lessonNumber: 2,
        title: "God's Purpose: Why We Exist",
        audioUrl: "https://cdn.example.com/2.mp3",
        audioUploadKey: "key_2",
        audioFileName: "2. God's Purpose - Why We Exist - 30 Dec 2025.mp3",
        audioFileSize: 222,
        audioUploadedAt: new Date("2026-06-09T17:32:18.000Z"),
      },
    ]);
  });

  test("throws when a lesson is missing from the manifest", () => {
    expect(() =>
      buildPpcLessonAudioUpdates(
        [
          {
            name: "1. Gospel - The Word of Truth - 4 Jan 2025.mp3",
            key: "key_1",
            url: "https://cdn.example.com/1.mp3",
            size: 111,
            uploadedAt: "2026-06-09T17:31:49.000Z",
          },
        ],
        [
          { id: 47, lessonNumber: 1, title: "Gospel: The Word of Truth" },
          { id: 48, lessonNumber: 2, title: "God's Purpose: Why We Exist" },
        ],
      ),
    ).toThrow("Missing teaching file for lesson 2");
  });

  test("throws on duplicate lesson numbers in the manifest", () => {
    expect(() =>
      buildPpcLessonAudioUpdates(
        [
          {
            name: "1. Gospel - The Word of Truth - 4 Jan 2025.mp3",
            key: "key_1",
            url: "https://cdn.example.com/1.mp3",
            size: 111,
            uploadedAt: "2026-06-09T17:31:49.000Z",
          },
          {
            name: "1. Gospel - Alternate.mp3",
            key: "key_1b",
            url: "https://cdn.example.com/1b.mp3",
            size: 112,
            uploadedAt: "2026-06-09T17:31:50.000Z",
          },
        ],
        [{ id: 47, lessonNumber: 1, title: "Gospel: The Word of Truth" }],
      ),
    ).toThrow("Duplicate teaching file for lesson 1");
  });

  test("keeps lessons outside the release scope in draft", () => {
    expect(
      getPpcLessonReleaseStatusUpdates(
        [
          { id: 21, levelId: 2, lessonNumber: 1, status: "draft" },
          { id: 22, levelId: 2, lessonNumber: 2, status: "published" },
          { id: 23, levelId: 2, lessonNumber: 3, status: "published" },
          { id: 31, levelId: 3, lessonNumber: 1, status: "published" },
        ],
        { 1: [1, 2, 3, 4, 5], 2: [1, 2] },
      ),
    ).toEqual([
      { id: 21, status: "published" },
      { id: 23, status: "draft" },
      { id: 31, status: "draft" },
    ]);
  });
});
