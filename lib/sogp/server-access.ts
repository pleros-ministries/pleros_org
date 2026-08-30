import { getSogpDayData } from "@/lib/db/queries/sogp";
import { getSubmission } from "@/lib/db/queries/submissions";
import type { SogpCurriculumLevel } from "./curriculum";
import { canAccessSogpDay } from "./day-access";

export async function requireSogpDayAccess(userId: string, dayNumber: number) {
  const data = await getSogpDayData(userId, dayNumber);
  const curriculumLevel = data?.track.curriculumLevel as
    | SogpCurriculumLevel
    | undefined;
  const previousLevelTracks = data && curriculumLevel && curriculumLevel > 1
    ? data.dashboard.tracks.filter(
        (track) => track.curriculumLevel === curriculumLevel - 1,
      )
    : [];
  const previousSubmissions = await Promise.all(
    previousLevelTracks.map((track) =>
      getSubmission(userId, track.lesson.id),
    ),
  );
  const previousLevelComplete =
    curriculumLevel === 1 ||
    (previousLevelTracks.length === 6 &&
      previousLevelTracks.every((track, index) => {
        const written = previousSubmissions[index];
        return (
          track.progress.quizPassed &&
          (!track.lesson.responsePrompt ||
            (written && written.status !== "draft"))
        );
      }));
  if (
    !data ||
    !curriculumLevel ||
    data.track.lesson.status !== "published" ||
    !canAccessSogpDay({
      learnerState: data.dashboard.learnerState,
      now: new Date(),
      releaseAt: data.track.releaseAt,
      curriculumLevel,
      previousLevelComplete,
    })
  ) {
    throw new Error("SOGP day is unavailable.");
  }
  return data;
}
