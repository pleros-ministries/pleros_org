type InactivityReminderProps = {
  studentName: string;
  currentLevel: number;
  currentLesson: string;
  daysSinceActivity: number;
  resumeUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function inactivityReminderHtml({
  studentName,
  currentLevel,
  currentLesson,
  daysSinceActivity,
  resumeUrl,
}: InactivityReminderProps): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #142033; max-width: 520px; margin: 0 auto; padding: 32px 16px;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">Pleros Perfecting Courses</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">We miss you, ${studentName}</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    It's been ${daysSinceActivity} days since your last activity on Level ${currentLevel}. Your next lesson is <strong>${currentLesson}</strong>.
  </p>
  <a href="${resumeUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #18181b; color: #fff; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">
    Continue learning
  </a>
  <hr style="border: none; border-top: 1px solid rgba(15,23,40,0.08); margin: 24px 0;" />
  <p style="font-size: 11px; color: #9ca3af;">
    You're receiving this because you have an active PPC account. Reminders are sent every 2 days when you're inactive.
  </p>
</body>
</html>`.trim();
}

type SubmissionReviewedProps = {
  studentName: string;
  lessonTitle: string;
  status: "approved" | "needs_revision";
  reviewerNote?: string | null;
  lessonUrl: string;
};

export function submissionReviewedHtml({
  studentName,
  lessonTitle,
  status,
  reviewerNote,
  lessonUrl,
}: SubmissionReviewedProps): string {
  const statusText = status === "approved" ? "approved" : "needs revision";
  const statusColor = status === "approved" ? "#059669" : "#d97706";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #142033; max-width: 520px; margin: 0 auto; padding: 32px 16px;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">Pleros Perfecting Courses</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">Submission ${statusText}</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    Hi ${studentName}, your written response for <strong>${lessonTitle}</strong> has been
    <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>.
  </p>
  ${reviewerNote ? `<div style="margin: 16px 0; padding: 12px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 4px; font-size: 13px; color: #3f3f46;"><strong>Reviewer note:</strong> ${reviewerNote}</div>` : ""}
  <a href="${lessonUrl}" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #18181b; color: #fff; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">
    View lesson
  </a>
</body>
</html>`.trim();
}

type GraduationCongratulationsProps = {
  studentName: string;
  levelTitle: string;
  nextLevelTitle?: string;
  dashboardUrl: string;
};

export function graduationCongratulationsHtml({
  studentName,
  levelTitle,
  nextLevelTitle,
  dashboardUrl,
}: GraduationCongratulationsProps): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #142033; max-width: 520px; margin: 0 auto; padding: 32px 16px;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">Pleros Perfecting Courses</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">Congratulations, ${studentName}! 🎓</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    You've graduated from <strong>${levelTitle}</strong>.
    ${nextLevelTitle ? `Your next journey begins with <strong>${nextLevelTitle}</strong>.` : "You've completed all levels!"}
  </p>
  <a href="${dashboardUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #18181b; color: #fff; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">
    ${nextLevelTitle ? "Start next level" : "View dashboard"}
  </a>
</body>
</html>`.trim();
}

type StaffAssignmentProps = {
  staffName: string;
  itemLabel: string;
  detail: string;
  url: string;
  ctaLabel: string;
};

export function staffAssignmentHtml({
  staffName,
  itemLabel,
  detail,
  url,
  ctaLabel,
}: StaffAssignmentProps): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #142033; max-width: 520px; margin: 0 auto; padding: 32px 16px;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">Pleros Perfecting Courses</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">New assignment for ${staffName}</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    ${itemLabel}
  </p>
  <div style="margin: 16px 0; padding: 12px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 4px; font-size: 13px; color: #3f3f46;">
    ${detail}
  </div>
  <a href="${url}" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #18181b; color: #fff; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">
    ${ctaLabel}
  </a>
</body>
</html>`.trim();
}

export type WelcomePackAccessProps = {
  name: string;
  dashboardUrl: string;
};

export type WelcomePackExtrasUnlockedProps = {
  name: string;
  dashboardUrl: string;
};

export type ContactSubmissionNotificationProps = {
  fullName: string;
  email: string;
  phone: string;
  location: string | null;
  message: string;
  submittedAt: string;
  adminUrl: string;
};

export function welcomePackAccessHtml({
  name,
  dashboardUrl,
}: WelcomePackAccessProps): string {
  const safeName = escapeHtml(name);
  const safeDashboardUrl = escapeHtml(dashboardUrl);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: 'Suisse Int\\'l', Inter, ui-sans-serif, system-ui, sans-serif; background-color: #fdfdfc; margin: 0; padding: 40px 16px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(15, 23, 40, 0.08); border-radius: 20px; box-shadow: 0 10px 30px rgba(15, 23, 40, 0.08); overflow: hidden;">
    

    <div style="background-color: #011585; padding: 40px 32px; text-align: center;">
      <img src="https://pleros-org.vercel.app/brand/white-logotype.png" alt="Pleros" width="120" style="display: block; margin: 0 auto;" />
    </div>

  
    <div style="padding: 40px 32px;">
      <h1 style="font-size: 24px; font-weight: 600; color: #0d1726; margin: 0 0 16px; letter-spacing: -0.024em;">Your main gift is ready</h1>
      <p style="font-size: 16px; color: #142033; line-height: 1.6; margin: 0 0 32px; letter-spacing: -0.02em;">
        Welcome, ${safeName}! Your main Pleros welcome gift is ready in your dashboard. You can also unlock two extra gifts by sharing the free gift with someone who may be blessed by it.
      </p>
      
     
      <a href="${safeDashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #011585; color: #ffffff; border-radius: 999px; font-size: 16px; font-weight: 500; text-decoration: none; text-align: center; box-shadow: 0 4px 14px rgba(15, 23, 40, 0.05); line-height: 1;">
        Access your Welcome Pack
      </a>

      <hr style="border: none; border-top: 1px solid rgba(15, 23, 40, 0.08); margin: 40px 0 24px;" />
      

      <p style="font-size: 13px; color: #58657a; margin: 0; line-height: 1.5;">
        You're receiving this email because you recently signed up for Pleros. If this was a mistake, you can simply ignore it.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

export function welcomePackExtrasUnlockedHtml({
  name,
  dashboardUrl,
}: WelcomePackExtrasUnlockedProps): string {
  const safeName = escapeHtml(name);
  const safeDashboardUrl = escapeHtml(dashboardUrl);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: 'Suisse Int\\'l', Inter, ui-sans-serif, system-ui, sans-serif; background-color: #fdfdfc; margin: 0; padding: 40px 16px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(15, 23, 40, 0.08); border-radius: 20px; box-shadow: 0 10px 30px rgba(15, 23, 40, 0.08); overflow: hidden;">
    <div style="background-color: #011585; padding: 40px 32px; text-align: center;">
      <img src="https://pleros-org.vercel.app/brand/white-logotype.png" alt="Pleros" width="120" style="display: block; margin: 0 auto;" />
    </div>

    <div style="padding: 40px 32px;">
      <h1 style="font-size: 24px; font-weight: 600; color: #0d1726; margin: 0 0 16px; letter-spacing: -0.024em;">Your extra gifts are unlocked</h1>
      <p style="font-size: 16px; color: #142033; line-height: 1.6; margin: 0 0 32px; letter-spacing: -0.02em;">
        Thank you, ${safeName}. Your two extra Pleros welcome gifts are now available in your dashboard.
      </p>

      <a href="${safeDashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #011585; color: #ffffff; border-radius: 999px; font-size: 16px; font-weight: 500; text-decoration: none; text-align: center; box-shadow: 0 4px 14px rgba(15, 23, 40, 0.05); line-height: 1;">
        Open your unlocked gifts
      </a>
    </div>
  </div>
</body>
</html>`.trim();
}

export function contactSubmissionNotificationHtml({
  fullName,
  email,
  phone,
  location,
  message,
  submittedAt,
  adminUrl,
}: ContactSubmissionNotificationProps): string {
  const safeFullName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeLocation = escapeHtml(location ?? "Not provided");
  const safeMessage = escapeHtml(message);
  const safeSubmittedAt = escapeHtml(submittedAt);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #142033; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">Pleros website contact</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">New contact submission</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    A new public contact message was submitted on ${safeSubmittedAt}.
  </p>

  <div style="margin: 20px 0; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tbody>
        <tr><td style="padding: 10px 12px; background: #fafafa; width: 140px; color: #58657a;">Full name</td><td style="padding: 10px 12px;">${safeFullName}</td></tr>
        <tr><td style="padding: 10px 12px; background: #fafafa; width: 140px; color: #58657a;">Email</td><td style="padding: 10px 12px;">${safeEmail}</td></tr>
        <tr><td style="padding: 10px 12px; background: #fafafa; width: 140px; color: #58657a;">Phone</td><td style="padding: 10px 12px;">${safePhone}</td></tr>
        <tr><td style="padding: 10px 12px; background: #fafafa; width: 140px; color: #58657a;">Location</td><td style="padding: 10px 12px;">${safeLocation}</td></tr>
      </tbody>
    </table>
  </div>

  <div style="margin: 18px 0; padding: 14px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px;">
    <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #58657a;">Message</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${safeMessage}</p>
  </div>

  <a href="${adminUrl}" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #18181b; color: #fff; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none;">
    Open in admin
  </a>
</body>
</html>`.trim();
}
