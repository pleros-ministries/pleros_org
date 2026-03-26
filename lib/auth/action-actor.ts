import type { AppSession } from "@/lib/app-session";

export function getStudentSelfActor(session: AppSession) {
  if (session.user.role !== "student") {
    throw new Error("Forbidden: only students can perform this action");
  }

  return {
    userId: session.user.id,
    authorId: session.user.id,
    authorRole: "student" as const,
  };
}

export function getSignedInActor(session: AppSession) {
  return {
    authorId: session.user.id,
    authorRole: session.user.role,
  };
}

export function getStaffActor(session: AppSession) {
  if (session.user.role !== "admin" && session.user.role !== "instructor") {
    throw new Error("Forbidden: only staff can perform this action");
  }

  return {
    reviewerId: session.user.id,
    reviewerRole: session.user.role,
  };
}
