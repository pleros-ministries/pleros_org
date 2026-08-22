import { sendStaffAssignmentNotification } from "@/lib/email/send";
import { sendPushToUser } from "@/lib/push/send";
import { getStaffAssignmentNotification } from "@/lib/staff-assignment-notifications";

type ReviewAssignmentInput = {
  actorId: string;
  previousAssignedToId: string | null;
  nextAssignedToId: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  studentName: string;
  lessonTitle: string;
  lessonNumber: number;
  levelId: number;
};

type QaAssignmentInput = {
  actorId: string;
  previousAssignedToId: string | null;
  nextAssignedToId: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  studentName: string;
  threadSubject: string;
  lessonTitle: string;
  lessonNumber: number;
  levelId: number;
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function notifyReviewAssignment(input: ReviewAssignmentInput) {
  if (!input.assignee) {
    return null;
  }

  const notification = getStaffAssignmentNotification({
    actorId: input.actorId,
    previousAssignedToId: input.previousAssignedToId,
    nextAssignedToId: input.nextAssignedToId,
    itemType: "review_submission",
    studentName: input.studentName,
    lessonTitle: input.lessonTitle,
    lessonNumber: input.lessonNumber,
    levelId: input.levelId,
    appUrl,
  });

  if (!notification) {
    return null;
  }

  const detail = `${input.studentName} submitted work for Level ${input.levelId}, Lesson ${input.lessonNumber}: ${input.lessonTitle}.`;

  await Promise.allSettled([
    sendStaffAssignmentNotification({
      to: input.assignee.email,
      staffName: input.assignee.name,
      subject: notification.emailSubject,
      itemLabel: "A review item has been assigned to you.",
      detail,
      url: notification.url,
      ctaLabel: "Open review queue",
    }),
    sendPushToUser(input.assignee.id, {
      title: notification.pushTitle,
      body: notification.pushBody,
      url: notification.url,
    }),
  ]);

  return notification;
}

export async function notifyQaAssignment(input: QaAssignmentInput) {
  if (!input.assignee) {
    return null;
  }

  const notification = getStaffAssignmentNotification({
    actorId: input.actorId,
    previousAssignedToId: input.previousAssignedToId,
    nextAssignedToId: input.nextAssignedToId,
    itemType: "qa_thread",
    studentName: input.studentName,
    threadSubject: input.threadSubject,
    lessonTitle: input.lessonTitle,
    lessonNumber: input.lessonNumber,
    levelId: input.levelId,
    appUrl,
  });

  if (!notification) {
    return null;
  }

  const detail = `${input.studentName} asked about Level ${input.levelId}, Lesson ${input.lessonNumber}: ${input.lessonTitle}. Subject: ${input.threadSubject}.`;

  await Promise.allSettled([
    sendStaffAssignmentNotification({
      to: input.assignee.email,
      staffName: input.assignee.name,
      subject: notification.emailSubject,
      itemLabel: "A Q&A thread has been assigned to you.",
      detail,
      url: notification.url,
      ctaLabel: "Open Q&A inbox",
    }),
    sendPushToUser(input.assignee.id, {
      title: notification.pushTitle,
      body: notification.pushBody,
      url: notification.url,
    }),
  ]);

  return notification;
}
