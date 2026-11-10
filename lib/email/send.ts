import { chunk, RESEND_BATCH_MAX, uniqueRecipients } from "./recipients";
import { resend, isEmailEnabled } from "./resend";
import {
  askPlerosStaffNotificationHtml,
  contactSubmissionNotificationHtml,
  plerosReplyHtml,
  emailVerificationHtml,
  inactivityReminderHtml,
  passwordResetHtml,
  submissionReviewedHtml,
  graduationCongratulationsHtml,
  staffAssignmentHtml,
  staffInviteHtml,
  superAdminSetupHtml,
  welcomePackAccessHtml,
  welcomePackExtrasUnlockedHtml,
  SOGP_ENROLLMENT_SUBJECT,
  sogpAuthCodeHtml,
  sogpEnrollmentHtml,
} from "./templates";

const FROM = process.env.EMAIL_FROM ?? "PPC <noreply@pleros.org>";

function getSogpSender(configuredSender: string | undefined): string {
  const configured = configuredSender?.trim();
  const bracketedAddress = configured?.match(/<\s*([^<>]+)\s*>$/)?.[1]?.trim();
  const plainAddress = configured?.match(/^[^\s<>]+@[^\s<>]+$/)?.[0];
  const address = bracketedAddress ?? plainAddress ?? "noreply@pleros.org";

  return `Pleros Ministries & Missions <${address}>`;
}

export async function sendInactivityReminder(opts: {
  to: string;
  studentName: string;
  currentLevel: number;
  currentLesson: string;
  daysSinceActivity: number;
  resumeUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Continue your Level ${opts.currentLevel} journey, ${opts.studentName}`,
    html: inactivityReminderHtml(opts),
  });
}

export async function sendSubmissionReviewed(opts: {
  to: string;
  studentName: string;
  lessonTitle: string;
  status: "approved" | "needs_revision";
  reviewerNote?: string | null;
  lessonUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  const statusWord = opts.status === "approved" ? "approved" : "needs revision";
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Your response for "${opts.lessonTitle}" — ${statusWord}`,
    html: submissionReviewedHtml(opts),
  });
}

export async function sendGraduationCongratulations(opts: {
  to: string;
  studentName: string;
  levelTitle: string;
  nextLevelTitle?: string;
  dashboardUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Congratulations on graduating ${opts.levelTitle}!`,
    html: graduationCongratulationsHtml(opts),
  });
}

export async function sendStaffAssignmentNotification(opts: {
  to: string;
  staffName: string;
  subject: string;
  itemLabel: string;
  detail: string;
  url: string;
  ctaLabel: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: staffAssignmentHtml({
      staffName: opts.staffName,
      itemLabel: opts.itemLabel,
      detail: opts.detail,
      url: opts.url,
      ctaLabel: opts.ctaLabel,
    }),
  });
}

export async function sendStaffInvite(opts: {
  to: string;
  role: "admin" | "instructor" | "pastor";
  inviteUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Set up your PPC admin access",
    html: staffInviteHtml({
      role: opts.role,
      inviteUrl: opts.inviteUrl,
    }),
  });
}

export async function sendSuperAdminSetup(opts: {
  to: string;
  name: string;
  setupUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Create your Pleros admin password",
    html: superAdminSetupHtml({
      name: opts.name,
      setupUrl: opts.setupUrl,
    }),
  });
}

export async function sendPasswordReset(opts: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  const isAdminReset = opts.resetUrl.includes("/admin/reset-password");

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: isAdminReset ? "Reset your staff password" : "Reset your PPC password",
    html: passwordResetHtml({
      name: opts.name,
      resetUrl: opts.resetUrl,
    }),
  });
}

export async function sendEmailVerification(opts: {
  to: string;
  name: string;
  verificationUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Verify your Pleros email",
    html: emailVerificationHtml({
      name: opts.name,
      verificationUrl: opts.verificationUrl,
    }),
  });
}

export async function sendWelcomePackAccessEmail(opts: {
  to: string;
  name: string;
  dashboardUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  const PLEROS_FROM = process.env.EMAIL_FROM_PLEROS ?? "Pleros <noreply@pleros.org>";

  return resend.emails.send({
    from: PLEROS_FROM,
    to: opts.to,
    subject: "Your Pleros welcome gift is ready",
    html: welcomePackAccessHtml({
      name: opts.name,
      dashboardUrl: opts.dashboardUrl,
    }),
  });
}

export async function sendWelcomePackExtrasUnlockedEmail(opts: {
  to: string;
  name: string;
  dashboardUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  const PLEROS_FROM = process.env.EMAIL_FROM_PLEROS ?? "Pleros <noreply@pleros.org>";

  return resend.emails.send({
    from: PLEROS_FROM,
    to: opts.to,
    subject: "Your extra Pleros gifts are unlocked",
    html: welcomePackExtrasUnlockedHtml({
      name: opts.name,
      dashboardUrl: opts.dashboardUrl,
    }),
  });
}

export type StaffNotificationResult =
  | { ok: true }
  | { ok: false; reason: "no_recipients" | "email_unavailable" | "send_failed" };

/**
 * Sends one copy of a staff notification to each recipient, so no one sees
 * anyone else's address. Resend reports failures in its result rather than
 * throwing, so both are checked.
 */
async function sendToEachStaff(
  recipients: readonly string[],
  message: { from: string; subject: string; html: string; replyTo?: string },
): Promise<StaffNotificationResult> {
  const to = uniqueRecipients(recipients);
  if (!to.length) return { ok: false, reason: "no_recipients" };
  if (!isEmailEnabled() || !resend) return { ok: false, reason: "email_unavailable" };

  try {
    for (const batch of chunk(to, RESEND_BATCH_MAX)) {
      const result = await resend.batch.send(
        batch.map((address) => ({ ...message, to: address })),
      );
      if (result?.error) return { ok: false, reason: "send_failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "send_failed" };
  }
}

/** Emails every admin and super admin about a new contact-form message. */
export async function sendContactSubmissionNotification(
  recipients: readonly string[],
  opts: {
    fullName: string;
    email: string;
    phone: string;
    location: string | null;
    message: string;
    submittedAt: string;
    adminUrl: string;
  },
): Promise<StaffNotificationResult> {
  return sendToEachStaff(recipients, {
    from: process.env.EMAIL_FROM_PLEROS ?? FROM,
    replyTo: opts.email,
    subject: `New contact submission from ${opts.fullName}`,
    html: contactSubmissionNotificationHtml(opts),
  });
}

export async function sendSogpEnrollmentEmail(opts: {
  to: string;
  name: string;
  cohortTitle: string;
  cohortDates: string;
  dashboardUrl: string;
}) {
  if (!isEmailEnabled() || !resend) return null;

  return resend.emails.send({
    from: getSogpSender(process.env.EMAIL_FROM_PLEROS),
    to: opts.to,
    subject: SOGP_ENROLLMENT_SUBJECT,
    html: sogpEnrollmentHtml(opts),
  });
}

/**
 * The same confirmation for several learners in one request (Resend batches
 * take up to 100) — used when staff move enrollees into another cohort.
 */
export async function sendSogpEnrollmentEmails(
  items: Array<{
    to: string;
    name: string;
    cohortTitle: string;
    cohortDates: string;
    dashboardUrl: string;
  }>,
) {
  if (!isEmailEnabled() || !resend || !items.length) return null;

  const from = getSogpSender(process.env.EMAIL_FROM_PLEROS);
  return resend.batch.send(
    items.map((item) => ({
      from,
      to: item.to,
      subject: SOGP_ENROLLMENT_SUBJECT,
      html: sogpEnrollmentHtml(item),
    })),
  );
}

export async function sendSogpAuthCodeEmail(opts: {
  to: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
}) {
  if (!isEmailEnabled() || !resend) return null;

  return resend.emails.send({
    from: getSogpSender(process.env.EMAIL_FROM_PLEROS),
    to: opts.to,
    subject: "Your SOGP verification code",
    html: sogpAuthCodeHtml({ otp: opts.otp, type: opts.type }),
  });
}

/**
 * Emails every admin and super admin about a new question or follow-up. No
 * reply-to is set: answers go through the admin area so they are recorded and
 * so an anonymous asker's address is never needed.
 */
export async function sendAskPlerosStaffNotification(
  recipients: readonly string[],
  opts: {
    askerLabel: string;
    groupName: string | null;
    message: string;
    isFollowUp: boolean;
    isAnonymous: boolean;
    episodeTitle?: string | null;
    adminUrl: string;
  },
): Promise<StaffNotificationResult> {
  const subject = opts.isFollowUp
    ? "Follow-up on a question for Pleros"
    : opts.isAnonymous
      ? "New anonymous question for Pleros"
      : `New question for Pleros from ${opts.askerLabel}`;

  return sendToEachStaff(recipients, {
    from: process.env.EMAIL_FROM_PLEROS ?? FROM,
    subject,
    html: askPlerosStaffNotificationHtml(opts),
  });
}

/** Tells the asker that Pleros has replied; the email carries no question or answer text. */
export async function sendPlerosReplyEmail(opts: { to: string; url: string }) {
  if (!isEmailEnabled() || !resend) return null;

  return resend.emails.send({
    from: getSogpSender(process.env.EMAIL_FROM_PLEROS),
    to: opts.to,
    subject: "Pleros has replied to your question",
    html: plerosReplyHtml({ url: opts.url }),
  });
}
