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
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">School of God's Purpose</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">We miss you, ${studentName}</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    It's been ${daysSinceActivity} days since your last activity on Level ${currentLevel}. Your next lesson is <strong>${currentLesson}</strong>.
  </p>
  <a href="${resumeUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #18181b; color: #fff; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">
    Continue learning
  </a>
  <hr style="border: none; border-top: 1px solid rgba(15,23,40,0.08); margin: 24px 0;" />
  <p style="font-size: 11px; color: #9ca3af;">
    You're receiving this because you have an active SOGP enrolment. Reminders are sent every 2 days when you're inactive.
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
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">School of God's Purpose</p>
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
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">School of God's Purpose</p>
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

export type StaffInviteProps = {
  role: "admin" | "instructor";
  inviteUrl: string;
};

export type PasswordResetProps = {
  name: string;
  resetUrl: string;
};

export type EmailVerificationProps = {
  name: string;
  verificationUrl: string;
};

export type SuperAdminSetupProps = {
  name: string;
  setupUrl: string;
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
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">Pleros admin</p>
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

export function staffInviteHtml({
  role,
  inviteUrl,
}: StaffInviteProps): string {
  const safeRole = escapeHtml(role === "admin" ? "admin" : "instructor");
  const safeInviteUrl = escapeHtml(inviteUrl);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #142033; max-width: 520px; margin: 0 auto; padding: 32px 16px;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">Pleros admin</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">You have been invited to Pleros admin</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    You have been invited as a <strong>${safeRole}</strong>. Use the link below to set your password and activate your staff access.
  </p>
  <a href="${safeInviteUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #18181b; color: #fff; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">
    Set password
  </a>
  <p style="font-size: 11px; color: #9ca3af; margin-top: 24px;">
    This invite expires in 7 days. If you were not expecting this, you can ignore this email.
  </p>
</body>
</html>`.trim();
}

export function passwordResetHtml({
  name,
  resetUrl,
}: PasswordResetProps): string {
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);
  const isAdminReset = resetUrl.includes("/admin/reset-password");
  const productLabel = isAdminReset ? "Pleros admin" : "School of God's Purpose";
  const accountLabel = isAdminReset ? "staff account" : "SOGP account";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #142033; max-width: 520px; margin: 0 auto; padding: 32px 16px;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">${productLabel}</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">Reset your password</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    Hi ${safeName}, use the link below to choose a new password for your ${accountLabel}.
  </p>
  <a href="${safeResetUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #011585; color: #fff; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">
    Reset password
  </a>
  <p style="font-size: 11px; color: #9ca3af; margin-top: 24px;">
    This link expires in 1 hour. If you did not request a password reset, you can ignore this email.
  </p>
</body>
</html>`.trim();
}

export function emailVerificationHtml({
  name,
  verificationUrl,
}: EmailVerificationProps): string {
  const safeName = escapeHtml(name);
  const safeVerificationUrl = escapeHtml(verificationUrl);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #142033; max-width: 520px; margin: 0 auto; padding: 32px 16px;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">Pleros account</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">Verify your email</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    Hi ${safeName}, verify this email address to confirm ownership of your Pleros account.
  </p>
  <a href="${safeVerificationUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #011585; color: #fff; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">
    Verify email
  </a>
  <p style="font-size: 11px; color: #9ca3af; margin-top: 24px;">
    If you did not create or update this account, you can ignore this email.
  </p>
</body>
</html>`.trim();
}

export function superAdminSetupHtml({
  name,
  setupUrl,
}: SuperAdminSetupProps): string {
  const safeName = escapeHtml(name);
  const safeSetupUrl = escapeHtml(setupUrl);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #142033; max-width: 520px; margin: 0 auto; padding: 32px 16px;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #58657a;">Pleros admin</p>
  <h1 style="font-size: 20px; margin: 12px 0 0;">Create your admin password</h1>
  <p style="font-size: 14px; color: #58657a; line-height: 1.6;">
    Hi ${safeName}, use the secure link below to confirm this inbox and create your super admin password.
  </p>
  <a href="${safeSetupUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #011585; color: #fff; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">
    Create password
  </a>
  <p style="font-size: 11px; color: #9ca3af; margin-top: 24px;">
    This link expires in 1 hour. If you were not setting up Pleros admin access, you can ignore this email.
  </p>
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

export type SogpEnrollmentProps = {
  name: string;
  cohortTitle: string;
  cohortDates: string;
  dashboardUrl: string;
};

export const SOGP_ENROLLMENT_SUBJECT =
  "Your SOGP enrolment is confirmed — visit your dashboard";

export function sogpEnrollmentHtml({
  name,
  cohortTitle,
  cohortDates,
  dashboardUrl,
}: SogpEnrollmentProps): string {
  const safeName = escapeHtml(name);
  const safeCohortTitle = escapeHtml(cohortTitle);
  const safeCohortDates = escapeHtml(cohortDates);
  const safeDashboardUrl = escapeHtml(dashboardUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style type="text/css">
    @media screen {
      @font-face {
        font-family: 'Sen';
        font-style: normal;
        font-weight: 500;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/sen/v12/6xKjdSxYI9_3nPWN.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Sen';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/sen/v12/6xKjdSxYI9_3nPWN.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Be Vietnam Pro';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/bevietnampro/v12/QdVPSTAyLFyeg_IDWvOJmVES_Hw3BXo.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Be Vietnam Pro';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/bevietnampro/v12/QdVMSTAyLFyeg_IDWvOJmVES_HToIW81Rb0.woff2') format('woff2');
      }
    }
    @media only screen and (max-width: 620px) {
      .email-shell { padding: 18px 10px !important; }
      .email-header { padding: 28px 22px 26px !important; }
      .email-content { padding: 28px 22px !important; }
      .email-footer { padding: 20px 22px !important; }
      .email-heading { font-size: 27px !important; }
      .email-button { display: block !important; text-align: center !important; }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    .email-heading, .email-button, .email-body { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body class="email-body" style="font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif; background:#f4f9ff; margin:0; padding:0; color:#061056;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f9ff" style="width:100%; background:#f4f9ff; border-collapse:collapse;">
    <tr>
      <td class="email-shell" align="center" style="padding:44px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%; max-width:560px; background:#ffffff; border:1px solid #d7e8f2; border-radius:20px; border-collapse:separate; overflow:hidden; box-shadow:0 12px 32px rgba(6,16,86,.06);">
          <tr>
            <td class="email-header" bgcolor="#e0f3ff" style="background:#e0f3ff; padding:34px 34px 30px;">
              <span style="display:inline-block; background:#e9ed01; border-radius:999px; padding:7px 11px; font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif; font-size:11px; line-height:1; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#061056;">School of God's Purpose</span>
              <h1 class="email-heading" style="font-family:'Sen','Trebuchet MS',Arial,sans-serif; font-size:30px; line-height:1.12; font-weight:600; letter-spacing:-.025em; color:#061056; margin:20px 0 0;">Your enrolment is confirmed</h1>
            </td>
          </tr>
          <tr>
            <td class="email-content email-body" style="font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif; padding:32px 34px; color:#061056;">
              <p style="font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif; font-size:16px; line-height:1.65; font-weight:400; margin:0 0 22px;">Welcome, ${safeName}. Your enrolment in <strong style="font-weight:600;">${safeCohortTitle}</strong> is confirmed.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f9ff" style="width:100%; background:#f4f9ff; border:1px solid #dcecf5; border-radius:12px; border-collapse:separate;">
                <tr>
                  <td style="padding:15px 17px;">
                    <p style="font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif; font-size:11px; line-height:1.2; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#40518a; margin:0 0 5px;">Your cohort</p>
                    <p style="font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5; font-weight:400; color:#061056; margin:0;">${safeCohortDates}</p>
                  </td>
                </tr>
              </table>
              <p style="font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif; font-size:15px; line-height:1.7; font-weight:400; color:#40518a; margin:24px 0;">Visit your dashboard for the welcome video and your next steps.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                <tr>
                  <td align="center" bgcolor="#051480" style="background:#051480; border-radius:999px; mso-padding-alt:14px 22px;">
                    <a class="email-button" href="${safeDashboardUrl}" style="display:inline-block; padding:14px 22px; font-family:'Sen','Trebuchet MS',Arial,sans-serif; font-size:14px; line-height:1.2; font-weight:500; color:#ffffff; text-decoration:none; border-radius:999px;">Open Dashboard</a>
                  </td>
                </tr>
              </table>
              <p style="font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif; font-size:12px; line-height:1.6; font-weight:400; color:#6876a0; margin:24px 0 0;">If the button does not work, copy and paste this link into your browser:<br /><a href="${safeDashboardUrl}" style="color:#051480; text-decoration:underline; word-break:break-all;">${safeDashboardUrl}</a></p>
            </td>
          </tr>
          <tr>
            <td class="email-footer email-body" bgcolor="#f8fbfd" style="font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif; background:#f8fbfd; border-top:1px solid #e4eef4; padding:20px 34px; color:#6876a0;">
              <p style="font-size:12px; line-height:1.55; font-weight:400; margin:0;"><strong style="font-weight:600; color:#061056;">Pleros Ministries &amp; Missions</strong><br />Helping you fulfil God's purpose.</p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

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
      <p style="font-size: 28px; line-height: 1; color: #ffffff; font-weight: 700; letter-spacing: -0.04em; margin: 0;">
        Pleros
      </p>
    </div>


    <div style="padding: 40px 32px;">
      <h1 style="font-size: 24px; font-weight: 600; color: #0d1726; margin: 0 0 16px; letter-spacing: -0.024em;">Your welcome pack is ready</h1>
      <p style="font-size: 16px; color: #142033; line-height: 1.6; margin: 0 0 32px; letter-spacing: -0.02em;">
        Welcome, ${safeName}! Your Pleros welcome pack is ready and waiting for you in your dashboard.
      </p>


      <a href="${safeDashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #011585; color: #ffffff; border-radius: 999px; font-size: 16px; font-weight: 500; text-decoration: none; text-align: center; box-shadow: 0 4px 14px rgba(15, 23, 40, 0.05); line-height: 1;">
        Access your welcome pack
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
      <p style="font-size: 28px; line-height: 1; color: #ffffff; font-weight: 700; letter-spacing: -0.04em; margin: 0;">
        Pleros
      </p>
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
