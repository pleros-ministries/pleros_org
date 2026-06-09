import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { buildContactStatusUpdate, type ContactSubmissionStatus } from "@/lib/contact-submissions";

import * as schema from "../schema";

export async function createContactSubmission(input: {
  fullName: string;
  email: string;
  phone: string;
  location: string | null;
  message: string;
  status?: ContactSubmissionStatus;
  isSpam: boolean;
  spamReasons: string[];
  honeypotValue: string | null;
  formStartedAt: Date | null;
  submitDurationMs: number | null;
}) {
  const [created] = await db
    .insert(schema.contactSubmissions)
    .values({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      location: input.location,
      message: input.message,
      status: input.status ?? "new",
      isSpam: input.isSpam,
      spamReasons: input.spamReasons,
      honeypotValue: input.honeypotValue,
      formStartedAt: input.formStartedAt,
      submitDurationMs: input.submitDurationMs,
    })
    .returning();

  return created;
}

export async function getContactSubmissionById(submissionId: number) {
  return (
    db.query.contactSubmissions.findFirst({
      where: (submission, { eq: eq2 }) => eq2(submission.id, submissionId),
    }) ?? null
  );
}

export async function getContactSubmissionSummaries() {
  const rows = await db.query.contactSubmissions.findMany({
    orderBy: (submission, { desc: desc2 }) => [desc2(submission.createdAt)],
  });

  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    location: row.location,
    messagePreview:
      row.message.length > 120
        ? `${row.message.slice(0, 117).trimEnd()}...`
        : row.message,
    status: row.status,
    isSpam: row.isSpam,
    createdAt: row.createdAt,
  }));
}

export async function updateContactSubmissionStatus(
  submissionId: number,
  nextStatus: ContactSubmissionStatus,
) {
  const existing = await getContactSubmissionById(submissionId);
  if (!existing) {
    return null;
  }

  const [updated] = await db
    .update(schema.contactSubmissions)
    .set(buildContactStatusUpdate(existing, nextStatus))
    .where(eq(schema.contactSubmissions.id, submissionId))
    .returning();

  return updated ?? null;
}

export async function recordContactSubmissionNotificationResult(
  submissionId: number,
  result:
    | { ok: true }
    | { ok: false; reason: "missing_contact_inbox" | "email_unavailable" | "send_failed" },
) {
  const [updated] = await db
    .update(schema.contactSubmissions)
    .set({
      notificationSentAt: result.ok ? new Date() : null,
      notificationFailure: result.ok ? null : result.reason,
      updatedAt: new Date(),
    })
    .where(eq(schema.contactSubmissions.id, submissionId))
    .returning();

  return updated ?? null;
}
