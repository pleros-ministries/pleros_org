"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import {
  evaluateContactSpam,
  isContactSubmissionStatus,
  normalizeContactSubmissionInput,
  validateContactSubmissionInput,
} from "@/lib/contact-submissions";
import type { ContactSubmitActionState } from "@/lib/contact-form-state";
import {
  createContactSubmission,
  recordContactSubmissionNotificationResult,
  updateContactSubmissionStatus,
} from "@/lib/db/queries/contact-submissions";
import { sendContactSubmissionNotification } from "@/lib/email/send";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitContactFormAction(
  _previousState: ContactSubmitActionState,
  formData: FormData,
): Promise<ContactSubmitActionState> {
  const values = {
    fullName: readString(formData, "fullName"),
    email: readString(formData, "email"),
    phone: readString(formData, "phone"),
    location: readString(formData, "location"),
    message: readString(formData, "message"),
  };

  const normalized = normalizeContactSubmissionInput(values);
  const errors = validateContactSubmissionInput(normalized);
  const spamAudit = evaluateContactSpam({
    honeypot: readString(formData, "company"),
    formStartedAt: readString(formData, "formStartedAt"),
  });

  if (spamAudit.reasons.includes("honeypot")) {
    await createContactSubmission({
      ...normalized,
      isSpam: true,
      spamReasons: spamAudit.reasons,
      honeypotValue: spamAudit.honeypotValue,
      formStartedAt: spamAudit.formStartedAt,
      submitDurationMs: spamAudit.submitDurationMs,
    });
    redirect("/welcome");
  }

  if (Object.keys(errors).length > 0) {
    return {
      values,
      errors,
      formError: null,
    };
  }

  if (spamAudit.blockSubmission) {
    await createContactSubmission({
      ...normalized,
      isSpam: true,
      spamReasons: spamAudit.reasons,
      honeypotValue: spamAudit.honeypotValue,
      formStartedAt: spamAudit.formStartedAt,
      submitDurationMs: spamAudit.submitDurationMs,
    });

    return {
      values,
      errors: {},
      formError: "Please wait a moment and try again.",
    };
  }

  const created = await createContactSubmission({
    ...normalized,
    isSpam: false,
    spamReasons: [],
    honeypotValue: spamAudit.honeypotValue,
    formStartedAt: spamAudit.formStartedAt,
    submitDurationMs: spamAudit.submitDurationMs,
  });

  const siteUrl = resolvePublicSiteUrl(process.env);
  const notificationResult = await sendContactSubmissionNotification({
    fullName: created.fullName,
    email: created.email,
    phone: created.phone,
    location: created.location,
    message: created.message,
    submittedAt: created.createdAt.toISOString(),
    adminUrl: `${siteUrl}/admin/contact?submission=${created.id}`,
  });

  await recordContactSubmissionNotificationResult(created.id, notificationResult);
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/contact");
  redirect("/welcome");
}

export async function updateContactSubmissionStatusAction(formData: FormData) {
  const session = await getAppSession();

  if (!session || (session.user.role !== "admin" && session.user.role !== "instructor")) {
    throw new Error("Forbidden: only staff can perform this action");
  }

  const submissionId = Number(readString(formData, "submissionId"));
  const status = readString(formData, "status");

  if (!Number.isFinite(submissionId) || submissionId <= 0) {
    throw new Error("Invalid submission id");
  }

  if (!isContactSubmissionStatus(status)) {
    throw new Error("Invalid contact submission status");
  }

  await updateContactSubmissionStatus(submissionId, status);
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/contact");
}
