export type PpcTeachingManifestEntry = {
  name: string;
  key: string;
  url: string;
  size: number;
  uploadedAt: string;
};

export type PpcLessonSyncInput = {
  id: number;
  lessonNumber: number;
  title: string;
};

export type PpcLessonReleaseStatusInput = {
  id: number;
  levelId: number;
  lessonNumber: number;
  status: "draft" | "published";
};

export type PpcLessonAudioUpdate = {
  id: number;
  lessonNumber: number;
  title: string;
  audioUrl: string;
  audioUploadKey: string;
  audioFileName: string;
  audioFileSize: number;
  audioUploadedAt: Date;
};

export function extractTeachingLessonNumber(fileName: string): number | null {
  const match = fileName.match(/^\s*(\d+)[._\s-]/);
  return match ? Number(match[1]) : null;
}

export function buildPpcLessonAudioUpdates(
  manifestEntries: PpcTeachingManifestEntry[],
  lessons: PpcLessonSyncInput[],
): PpcLessonAudioUpdate[] {
  const manifestByLessonNumber = new Map<number, PpcTeachingManifestEntry>();

  for (const entry of manifestEntries) {
    const lessonNumber = extractTeachingLessonNumber(entry.name);
    if (!lessonNumber) {
      throw new Error(`Could not extract lesson number from teaching file: ${entry.name}`);
    }

    if (manifestByLessonNumber.has(lessonNumber)) {
      throw new Error(`Duplicate teaching file for lesson ${lessonNumber}: ${entry.name}`);
    }

    manifestByLessonNumber.set(lessonNumber, entry);
  }

  const updates = lessons.map((lesson) => {
    const manifestEntry = manifestByLessonNumber.get(lesson.lessonNumber);
    if (!manifestEntry) {
      throw new Error(
        `Missing teaching file for lesson ${lesson.lessonNumber}: ${lesson.title}`,
      );
    }

    return {
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      audioUrl: manifestEntry.url,
      audioUploadKey: manifestEntry.key,
      audioFileName: manifestEntry.name,
      audioFileSize: manifestEntry.size,
      audioUploadedAt: new Date(manifestEntry.uploadedAt),
    };
  });

  if (manifestEntries.length !== lessons.length) {
    const lessonNumbers = new Set(lessons.map((lesson) => lesson.lessonNumber));
    const extras = manifestEntries.filter((entry) => {
      const lessonNumber = extractTeachingLessonNumber(entry.name);
      return lessonNumber ? !lessonNumbers.has(lessonNumber) : true;
    });

    if (extras.length > 0) {
      throw new Error(
        `Teaching manifest contains entries with no matching lessons: ${extras
          .map((entry) => entry.name)
          .join(", ")}`,
      );
    }
  }

  return updates;
}

export function getPpcLessonReleaseStatusUpdates(
  lessons: PpcLessonReleaseStatusInput[],
  releaseScope: Record<number, number[]>,
) {
  return lessons.reduce<Array<{ id: number; status: "draft" | "published" }>>(
    (updates, lesson) => {
      const releasedLessonNumbers = releaseScope[lesson.levelId] ?? [];
      const nextStatus = releasedLessonNumbers.includes(lesson.lessonNumber)
        ? "published"
        : "draft";

      if (lesson.status !== nextStatus) {
        updates.push({
          id: lesson.id,
          status: nextStatus,
        });
      }

      return updates;
    },
    [],
  );
}
