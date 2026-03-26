import type { AppSession } from "@/lib/app-session";

type QaThreadAccessRecord = {
  id: number;
  userId: string;
};

export function assertCanAccessQaThread(
  session: AppSession,
  thread: QaThreadAccessRecord,
) {
  if (session.user.role === "student" && thread.userId !== session.user.id) {
    throw new Error("Forbidden: students can only access their own Q&A threads");
  }
}
