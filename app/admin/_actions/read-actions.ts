"use server";

import { requireAdmin, requireStaff, requireSuperAdmin } from "@/lib/auth/require-role";
import type { AdminRegistrantSummary } from "@/lib/admin-registrants";
import type {
  AdminPlatformData,
  AdminSchoolOfPurposeWaitlistEntry,
  AdminStaffData,
} from "@/lib/admin-query";
import { getAdminRegistrantList } from "@/lib/db/queries/admin-registrants";
import { getSchoolOfPurposeWaitlistEntries } from "@/lib/db/queries/school-of-purpose-waitlist";
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
