type AssignmentNotificationInput =
  | {
      actorId: string;
      previousAssignedToId: string | null;
      nextAssignedToId: string | null;
      itemType: "review_submission";
      studentName: string;
      lessonTitle: string;
      lessonNumber: number;
      levelId: number;
      appUrl: string;
    }
  | {
      actorId: string;
      previousAssignedToId: string | null;
      nextAssignedToId: string | null;
      itemType: "qa_thread";
      studentName: string;
      threadSubject: string;
      lessonTitle: string;
      lessonNumber: number;
      levelId: number;
      appUrl: string;
    };

type AssignmentNotificationOutput = {
  emailSubject: string;
  pushTitle: string;
  pushBody: string;
  url: string;
};

export function getStaffAssignmentNotification(
  input: AssignmentNotificationInput,
): AssignmentNotificationOutput | null {
  if (!input.nextAssignedToId) {
    return null;
  }

  if (input.nextAssignedToId === input.previousAssignedToId) {
    return null;
  }

  if (input.nextAssignedToId === input.actorId) {
    return null;
  }

  const pushBody = `${input.studentName} · L${input.levelId}.${input.lessonNumber} ${input.lessonTitle}`;

  if (input.itemType === "review_submission") {
    return {
      emailSubject: `Assigned review: ${input.studentName} - "${input.lessonTitle}"`,
      pushTitle: "New review assignment",
      pushBody,
      url: `${input.appUrl}/admin/review`,
    };
  }

  return {
    emailSubject: `Assigned Q&A thread: "${input.threadSubject}"`,
    pushTitle: "New Q&A assignment",
    pushBody,
    url: `${input.appUrl}/admin/qa`,
  };
}
