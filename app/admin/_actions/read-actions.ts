"use server";

import { requireAdmin, requireStaff, requireSuperAdmin } from "@/lib/auth/require-role";
import type { AdminRegistrantSummary } from "@/lib/admin-registrants";
import type {
  AdminDashboardData,
  AdminPlatformData,
  AdminSchoolOfPurposeWaitlistEntry,
  AdminSogpData,
  AdminStaffData,
} from "@/lib/admin-query";
import { getAdminRegistrantList } from "@/lib/db/queries/admin-registrants";
import { getSchoolOfPurposeWaitlistEntries } from "@/lib/db/queries/school-of-purpose-waitlist";
import { getAdminSogpData as getSogpOperationsData } from "@/lib/db/queries/sogp";
import { countDistinctLagosActivityDays } from "@/lib/sogp/formation-progress";
import { getSuperAdminOverviewMetrics } from "@/lib/db/queries/admin-analytics";
import { getStudentPlatformList } from "@/lib/db/queries/students";
import { getAllThreads } from "@/lib/db/queries/qa";
import { getReviewQueue } from "@/lib/db/queries/submissions";
import {
  listStaffInvites,
  listStaffUsers,
} from "@/lib/db/queries/staff-invites";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { hasAdminAccess } from "@/lib/app-role";
import { getDashboardStats } from "@/lib/db/queries/students";
import { getContentOverview } from "@/lib/db/queries/content";
import {
  getAssignmentOwnershipSummary,
  getContentDebtSummary,
  getQueuePressureSummary,
  getStaffAccessSummary,
  getSuperAdminOverviewCards,
  prioritizeOwnershipRows,
} from "@/lib/admin-dashboard";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

async function getStaffDirectory() {
  return db.query.users.findMany({
    where: (user, { eq: equal, or }) =>
      or(
        equal(user.role, "super_admin"),
        equal(user.role, "admin"),
        equal(user.role, "instructor"),
      ),
  });
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const session = await requireStaff();
  const canManageContent = hasAdminAccess(session.user.role);
  const [
    stats,
    registrants,
    reviewQueue,
    openThreads,
    contentOverview,
    staffAccess,
    superAdminOverviewMetrics,
    [userCount],
    [lessonCount],
  ] = await Promise.all([
    getDashboardStats(),
    getAdminRegistrantList(),
    getReviewQueue(),
    getAllThreads("open"),
    getContentOverview(),
    session.user.role === "super_admin"
      ? Promise.all([listStaffUsers(), listStaffInvites()])
      : Promise.resolve(null),
    session.user.role === "super_admin"
      ? getSuperAdminOverviewMetrics()
      : Promise.resolve(null),
    db.select({ count: count() }).from(schema.users),
    db
      .select({ count: count() })
      .from(schema.lessons)
      .where(eq(schema.lessons.status, "published")),
  ]);
  const contentDebt = getContentDebtSummary(
    contentOverview.map((level) => ({
      id: level.id,
      title: level.title,
      lessons: level.lessons.map((lesson) => ({
        id: lesson.id,
        lessonNumber: lesson.lessonNumber,
        title: lesson.title,
        status: lesson.status,
        audioUrl: lesson.audioUrl,
        notesContent: lesson.notesContent,
        responsePrompt: lesson.responsePrompt,
        responseMarkingGuide: lesson.responseMarkingGuide,
        questions: lesson.questions.map((question) => ({
          questionType: question.questionType,
          questionText: question.questionText,
          options: question.options as string[] | null,
          correctAnswer: question.correctAnswer,
        })),
      })),
    })),
  );
  const reviewOwnership = getAssignmentOwnershipSummary(
    reviewQueue,
    session.user.id,
    "submittedAt",
  );
  const qaOwnership = getAssignmentOwnershipSummary(
    openThreads,
    session.user.id,
    "createdAt",
  );
  const prioritizedReviewQueue = prioritizeOwnershipRows(
    reviewQueue,
    session.user.id,
  );
  const prioritizedOpenThreads = prioritizeOwnershipRows(
    openThreads,
    session.user.id,
  );
  const ppcAccounts = registrants.filter(
    (registrant) => registrant.accountStatus === "ppc_account",
  ).length;

  return {
    canManageContent,
    currentStaffId: session.user.id,
    overviewCards: superAdminOverviewMetrics
      ? getSuperAdminOverviewCards({
          ...superAdminOverviewMetrics,
          training: {
            averageProgress: stats.averageProgress,
            activeStudents: stats.activeStudents,
            pendingReviews: stats.pendingReviews,
            openQa: stats.openQa,
          },
        })
      : [
          {
            label: "Registrants",
            value: registrants.length,
            hint: `${stats.activeStudents} PPC accounts · ${registrants.length - ppcAccounts} welcome only`,
          },
          {
            label: "PPC avg. progress",
            value: `${stats.averageProgress}%`,
            hint: "Across cohort",
          },
          {
            label: "Pending reviews",
            value: stats.pendingReviews,
            hint: `${reviewOwnership.mine} yours · ${reviewOwnership.unassigned} unassigned`,
          },
          {
            label: "Open Q&A",
            value: stats.openQa,
            hint: `${qaOwnership.mine} yours · ${qaOwnership.unassigned} unassigned`,
          },
        ],
    stats,
    counts: {
      registrants: registrants.length,
      welcomeOnly: registrants.length - ppcAccounts,
      users: userCount?.count ?? 0,
      publishedLessons: lessonCount?.count ?? 0,
    },
    reviewOwnership,
    qaOwnership,
    reviewPressure: getQueuePressureSummary(reviewQueue, "submittedAt"),
    qaPressure: getQueuePressureSummary(openThreads, "createdAt"),
    contentDebt,
    staffAccessSummary: staffAccess
      ? getStaffAccessSummary(staffAccess[0], staffAccess[1])
      : null,
    reviewQueuePreview: prioritizedReviewQueue.slice(0, 5).map((item) => ({
      id: item.id,
      userId: item.userId,
      studentName: item.studentName,
      levelId: item.levelId,
      lessonNumber: item.lessonNumber,
      lessonTitle: item.lessonTitle,
      status: item.status,
      assignedToId: item.assignedToId,
      submittedAt: serializeDate(item.submittedAt),
    })),
    qaPreview: prioritizedOpenThreads.slice(0, 6).map((thread) => ({
      id: thread.id,
      subject: thread.subject,
      studentName: thread.studentName,
      levelId: thread.levelId,
      lessonNumber: thread.lessonNumber,
      assignedToId: thread.assignedToId,
      createdAt: serializeDate(thread.createdAt),
    })),
  };
}

export async function getAdminSchoolOfPurposeWaitlist(): Promise<
  AdminSchoolOfPurposeWaitlistEntry[]
> {
  await requireAdmin();

  const entries = await getSchoolOfPurposeWaitlistEntries();

  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    phone: entry.phone,
    email: entry.email,
    createdAt: entry.createdAt.toISOString(),
  }));
}

export async function getAdminSogpData(): Promise<AdminSogpData> {
  await requireAdmin();
  const [
    data,
    levelThreeLessons,
    quizRows,
    morningPrayerRows,
    podcastRows,
  ] = await Promise.all([
    getSogpOperationsData(),
    db.query.lessons.findMany({
      where: (lesson, { eq: equal }) => equal(lesson.levelId, 3),
      orderBy: (lesson, { asc }) => [asc(lesson.lessonNumber)],
    }),
    db.select({ lessonId: schema.quizQuestions.lessonId }).from(schema.quizQuestions),
    db
      .select({
        userId: schema.prayerWatchAttendance.userId,
        attendedDate: schema.prayerWatchAttendance.attendedDate,
      })
      .from(schema.prayerWatchAttendance)
      .where(eq(schema.prayerWatchAttendance.session, "morning")),
    db
      .select({
        userId: schema.podcastEpisodeProgress.userId,
        listenedAt: schema.podcastEpisodeProgress.listenedAt,
      })
      .from(schema.podcastEpisodeProgress),
  ]);
  const lessonsWithQuiz = new Set(quizRows.map((row) => row.lessonId));
  const ready = (lesson: {
    id: number;
    status: string;
    audioUrl: string | null;
    notesContent: string | null;
    responsePrompt: string | null;
    responseMarkingGuide: string | null;
  }) =>
    lesson.status === "published" &&
    Boolean(
      lesson.audioUrl &&
        lesson.notesContent &&
        lesson.responsePrompt &&
        lesson.responseMarkingGuide &&
        lessonsWithQuiz.has(lesson.id),
    );

  return {
    cohorts: data.cohorts.map((cohort) => ({
      id: cohort.id,
      slug: cohort.slug,
      title: cohort.title,
      status: cohort.status,
      startsAt: cohort.startsAt.toISOString(),
      endsAt: cohort.endsAt.toISOString(),
      telegramChannelUrl: cohort.telegramChannelUrl,
      telegramDiscussionUrl: cohort.telegramDiscussionUrl,
      telegramBotUsername: cohort.telegramBotUsername,
    })),
    enrollments: data.enrollments.map((enrollment) => {
      const cohort = data.cohorts.find((item) => item.id === enrollment.cohortId);
      const startDateKey = cohort?.startsAt.toISOString().slice(0, 10) ?? "";
      const endDateKey = cohort?.endsAt.toISOString().slice(0, 10) ?? "";
      const podcastDates = podcastRows
        .filter(
          (row) =>
            row.userId === enrollment.userId &&
            cohort &&
            row.listenedAt >= cohort.startsAt &&
            row.listenedAt <= cohort.endsAt,
        )
        .map((row) => row.listenedAt);

      return {
        id: enrollment.id,
        cohortId: enrollment.cohortId,
        firstName: enrollment.firstName,
        lastName: enrollment.lastName,
        name: enrollment.name,
        email: enrollment.email,
        phone: enrollment.phone,
        countryCode: enrollment.countryCode,
        country: enrollment.country,
        region: enrollment.region,
        status: enrollment.status,
        telegramLinkedAt: serializeDate(enrollment.telegramLinkedAt),
        createdAt: enrollment.createdAt.toISOString(),
        morningPrayerDays: morningPrayerRows.filter(
          (row) =>
            row.userId === enrollment.userId &&
            row.attendedDate >= startDateKey &&
            row.attendedDate <= endDateKey,
        ).length,
        podcastDaysLogged: countDistinctLagosActivityDays(podcastDates),
      };
    }),
    tracks: data.tracks.map(({ track, lesson }) => ({
      id: track.id,
      cohortId: track.cohortId,
      dayNumber: track.dayNumber,
      weekNumber: track.weekNumber,
      curriculumLevel: track.curriculumLevel,
      curriculumOrder: track.curriculumOrder,
      isRequired: track.isRequired,
      liveSessionNumber: track.liveSessionNumber,
      lessonId: lesson.id,
      levelId: lesson.levelId,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      status: lesson.status,
      ready: ready(lesson),
    })),
    levelThreeLessons: levelThreeLessons.map((lesson) => ({
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      status: lesson.status,
      ready: ready(lesson),
    })),
    liveClasses: data.liveClasses.map((liveClass) => ({
      id: liveClass.id,
      cohortId: liveClass.cohortId,
      title: liveClass.title,
      startsAt: liveClass.startsAt.toISOString(),
      endsAt: liveClass.endsAt.toISOString(),
      status: liveClass.status,
      youtubeLiveUrl: liveClass.youtubeLiveUrl,
      recordingUrl: liveClass.recordingUrl,
    })),
    certificates: data.certificates.map((certificate) => ({
      id: certificate.id,
      enrollmentId: certificate.enrollmentId,
      verificationCode: certificate.verificationCode,
      issuedAt: certificate.issuedAt.toISOString(),
      revokedAt: serializeDate(certificate.revokedAt),
    })),
    preparationDays: data.preparationDays.map((day) => ({
      id: day.id,
      cohortId: day.cohortId,
      publishDate: day.publishDate,
      countdownLabel: day.countdownLabel,
      introduction: day.introduction,
      status: day.status,
      resources: day.resources.map((resource) => ({
        id: resource.id,
        type: resource.type,
        title: resource.title,
        description: resource.description,
        url: resource.url,
        sortOrder: resource.sortOrder,
      })),
    })),
    telegram: {
      channelConfigured: Boolean(process.env.TELEGRAM_SOGP_CHANNEL_ID),
      botConfigured: Boolean(process.env.TELEGRAM_SOGP_BOT_TOKEN),
      webhookSecretConfigured: Boolean(process.env.TELEGRAM_SOGP_WEBHOOK_SECRET),
    },
  };
}

export async function getAdminRegistrants(): Promise<AdminRegistrantSummary[]> {
  await requireStaff();
  return getAdminRegistrantList();
}

export async function getAdminPlatformData(): Promise<AdminPlatformData> {
  const session = await requireAdmin();
  const [
    students,
    reviewerAssignments,
    instructors,
    [userCount],
    [lessonCount],
    [graduationCount],
  ] = await Promise.all([
    getStudentPlatformList(200),
    db
      .select({
        id: schema.reviewerAssignments.id,
        userId: schema.reviewerAssignments.userId,
        levelId: schema.reviewerAssignments.levelId,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.reviewerAssignments)
      .innerJoin(schema.users, eq(schema.reviewerAssignments.userId, schema.users.id)),
    db.query.users.findMany({
      where: (user, { eq: equal, or }) =>
        or(equal(user.role, "instructor"), equal(user.role, "admin")),
    }),
    db.select({ count: count() }).from(schema.users),
    db
      .select({ count: count() })
      .from(schema.lessons)
      .where(eq(schema.lessons.status, "published")),
    db.select({ count: count() }).from(schema.levelGraduations),
  ]);

  return {
    students,
    reviewerAssignments,
    instructors: instructors.map((instructor) => ({
      id: instructor.id,
      name: instructor.name,
      email: instructor.email,
    })),
    stats: {
      totalUsers: userCount?.count ?? 0,
      publishedLessons: lessonCount?.count ?? 0,
      totalGraduations: graduationCount?.count ?? 0,
    },
    adminId: session.user.id,
  };
}

export async function getAdminStaffData(): Promise<AdminStaffData> {
  await requireSuperAdmin();
  const [staffUsers, invites] = await Promise.all([
    listStaffUsers(),
    listStaffInvites(),
  ]);

  return {
    staffUsers: staffUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    })),
    invites: invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      invitedByName: invite.invitedByName,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
    })),
  };
}

export async function getAdminQaData() {
  const session = await requireStaff();
  const [rawThreads, staffUsers] = await Promise.all([
    getAllThreads(),
    getStaffDirectory(),
  ]);

  return {
    threads: rawThreads.map((thread) => ({
      id: thread.id,
      userId: thread.userId,
      lessonId: thread.lessonId,
      subject: thread.subject,
      assignedToId: thread.assignedToId,
      status: thread.status,
      createdAt: serializeDate(thread.createdAt) ?? new Date().toISOString(),
      studentName: thread.studentName,
      studentEmail: thread.studentEmail,
      lessonTitle: thread.lessonTitle,
      levelId: thread.levelId,
      lessonNumber: thread.lessonNumber,
    })),
    currentStaffId: session.user.id,
    currentStaffRole: hasAdminAccess(session.user.role) ? ("admin" as const) : ("instructor" as const),
    staffOptions: staffUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    })),
  };
}

export async function getAdminReviewData() {
  const session = await requireStaff();
  const [rawQueue, staffUsers] = await Promise.all([
    getReviewQueue(),
    getStaffDirectory(),
  ]);

  return {
    submissions: rawQueue.map((item) => ({
      id: item.id,
      userId: item.userId,
      lessonId: item.lessonId,
      content: item.content,
      status: item.status === "submitted" ? "pending_review" : item.status,
      reviewerNote: item.reviewerNote,
      assignedToId: item.assignedToId,
      submittedAt: serializeDate(item.submittedAt),
      reviewedAt: serializeDate(item.reviewedAt),
      studentName: item.studentName,
      studentEmail: item.studentEmail,
      lessonTitle: item.lessonTitle,
      lessonNumber: item.lessonNumber,
      levelId: item.levelId,
      responsePrompt: item.responsePrompt,
      responseMarkingGuide: item.responseMarkingGuide,
    })),
    currentStaffId: session.user.id,
    currentStaffRole: hasAdminAccess(session.user.role) ? ("admin" as const) : ("instructor" as const),
    staffOptions: staffUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    })),
  };
}
