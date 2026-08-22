import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import {
  getAllLessonsByLevel,
  getLevels,
  getLessonsByLevel,
} from "@/lib/db/queries/lessons";
import { getGraduations } from "@/lib/db/queries/graduations";
import { StudentDashboardView } from "@/components/ppc/student-dashboard-view";
import { db } from "@/lib/db";
import { studentProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPpcNotificationStatus } from "@/lib/ppc-notifications";
import {
  getCurrentLevelId,
  getDashboardFocus,
  getLevelJourneyRows,
} from "@/lib/student-journey";

export default async function StudentDashboardPage() {
  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/login"));
  }

  const userId = session.user.id;
  const levels = await getLevels();
  const graduations = await getGraduations(userId);
  const graduatedIds = new Set(graduations.map((g) => g.levelId));

  const currentLevel = getCurrentLevelId(
    graduations.map((graduation) => graduation.levelId),
    levels.length,
  );

  const [allCurrentLessons, currentLessons] = await Promise.all([
    getAllLessonsByLevel(currentLevel),
    getLessonsByLevel(currentLevel),
  ]);
  const progress = await db
    .select()
    .from(studentProgress)
    .where(eq(studentProgress.userId, userId));

  const currentProgress = currentLessons.map((lesson) => {
    const p = progress.find((pr) => pr.lessonId === lesson.id);
    return {
      lesson,
      completed: p
        ? p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved
        : false,
    };
  });

  const completedCount = currentProgress.filter((p) => p.completed).length;
  const lockedLessonCount = Math.max(
    allCurrentLessons.length - currentLessons.length,
    0,
  );
  const progressPercent =
    allCurrentLessons.length > 0
      ? Math.round((completedCount / allCurrentLessons.length) * 100)
      : 0;
  const nextLesson = currentProgress.find((p) => !p.completed);
  const dashboardFocus = getDashboardFocus({
    currentLevelId: currentLevel,
    completedLessons: completedCount,
    totalLessons: allCurrentLessons.length,
    lockedLessons: lockedLessonCount,
    nextLesson: nextLesson
      ? {
          id: nextLesson.lesson.id,
          lessonNumber: nextLesson.lesson.lessonNumber,
          title: nextLesson.lesson.title,
        }
      : null,
  });
  const pathwayRows = getLevelJourneyRows(levels, graduatedIds, currentLevel);
  const notificationStatus = getPpcNotificationStatus({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    CRON_SECRET: process.env.CRON_SECRET,
  });
  const pushStatus = notificationStatus.channels.find(
    (channel) => channel.id === "push",
  );

  return (
    <StudentDashboardView
      studentName={session.user.name}
      currentLevel={currentLevel}
      graduatedLevelCount={graduatedIds.size}
      completedLessonCount={completedCount}
      totalLessonCount={allCurrentLessons.length}
      progressPercent={progressPercent}
      dashboardFocus={dashboardFocus}
      pathwayRows={pathwayRows}
      isPushConfigured={pushStatus?.state === "ready"}
    />
  );
}
