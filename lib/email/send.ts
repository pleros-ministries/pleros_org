import { resend, isEmailEnabled } from "./resend";
import {
  inactivityReminderHtml,
  submissionReviewedHtml,
  graduationCongratulationsHtml,
  staffAssignmentHtml,
  welcomePackAccessHtml,
} from "./templates";

const FROM = process.env.EMAIL_FROM ?? "PPC <noreply@pleros.org>";

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
    subject: "Your Pleros Welcome Pack Access",
    html: welcomePackAccessHtml({
      name: opts.name,
      dashboardUrl: opts.dashboardUrl,
    }),
  });
}
