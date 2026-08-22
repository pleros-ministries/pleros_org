import type { Metadata } from "next";

import { PpcShell } from "@/components/ppc/ppc-shell";
import { StudentDashboardView } from "@/components/ppc/student-dashboard-view";
import type { AppSession } from "@/lib/app-session";
import {
  buildStudentLevelNavItems,
  type PpcStudentLevelSource,
} from "@/lib/ppc-shell";
import {
  getCurrentLevelId,
  getDashboardFocus,
  getLevelJourneyRows,
} from "@/lib/student-journey";

export const metadata: Metadata = {
  title: "PPC student dashboard preview",
  robots: {
    index: false,
    follow: false,
  },
};

const previewSession: AppSession = {
  user: {
    id: "preview-student",
    name: "Ada Student",
    email: "ada.student@example.com",
    role: "student",
  },
};

const previewLevels: PpcStudentLevelSource[] = [
  { id: 1, title: "Level 1 - Foundations", sortOrder: 1 },
  { id: 2, title: "Level 2 - Growth", sortOrder: 2 },
  { id: 3, title: "Level 3 - Ministry", sortOrder: 3 },
];

const graduatedLevelIds = [1];
const currentLevel = getCurrentLevelId(graduatedLevelIds, previewLevels.length);
const completedLessonCount = 1;
const totalLessonCount = 11;
const lockedLessonCount = 9;
const progressPercent = Math.round((completedLessonCount / totalLessonCount) * 100);
const dashboardFocus = getDashboardFocus({
  currentLevelId: currentLevel,
  completedLessons: completedLessonCount,
  totalLessons: totalLessonCount,
  lockedLessons: lockedLessonCount,
  nextLesson: {
    id: 202,
    lessonNumber: 2,
    title: "Growth through the word",
  },
});
const pathwayRows = getLevelJourneyRows(
  previewLevels,
  new Set(graduatedLevelIds),
  currentLevel,
);
const studentLevelNavItems = buildStudentLevelNavItems(
  previewLevels,
  graduatedLevelIds,
);

export default function PpcStudentDashboardPreviewPage() {
  return (
    <PpcShell
      session={previewSession}
      studentLevelNavItems={studentLevelNavItems}
      pathnameOverride="/ppc/student"
    >
      <StudentDashboardView
        studentName={previewSession.user.name}
        currentLevel={currentLevel}
        graduatedLevelCount={graduatedLevelIds.length}
        completedLessonCount={completedLessonCount}
        totalLessonCount={totalLessonCount}
        progressPercent={progressPercent}
        dashboardFocus={dashboardFocus}
        pathwayRows={pathwayRows}
        isPushConfigured={false}
      />
    </PpcShell>
  );
}
