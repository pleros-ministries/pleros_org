import {
  markAppInstalledAction,
  saveReminderPreferencesAction,
  saveTeachingTimeAction,
} from "@/app/_actions/notification-preferences-actions";
import { eq } from "drizzle-orm";

import { DashboardPageFrame, DashboardPageHeader } from "@/components/dashboard/shared/page";
import { ReportReminderForm } from "@/components/dashboard/report-reminder-form";
import { db } from "@/lib/db";
import { dailyReportPreferences } from "@/lib/db/schema";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";
import { SetupSteps } from "@/components/dashboard/welcome-pack-setup/setup-steps";
import {
  getReminderPreferences,
  hasPushSubscription,
} from "@/lib/db/queries/notification-preferences";
import { getSogpDashboardAccess } from "@/lib/db/queries/sogp-journey";
import {
  resolveReminderPreferences,
  toReminderSetupView,
} from "@/lib/notifications/reminder-preferences";
import { requireWelcomePackAccess } from "@/lib/welcome-pack-dashboard-access";

// Cache Components: reads the session and per-learner preferences.
export const instant = false;

/** Notifications and reminders under Profile (user, 18 October): the same steps
 * as the Welcome Pack's App and reminders card, plus the report reminder. */
export default async function ProfileRemindersPage() {
  const { userId } = await requireWelcomePackAccess();
  const [preferences, hasPushOnAnyDevice, access] = await Promise.all([
    // New learners are sent here straight after the welcome survey, so this
    // page must open even if preferences cannot be read: show the steps on
    // their defaults instead (saving then reports its own error).
    getReminderPreferences(userId).catch((error) => {
      console.error("Reminder preferences could not be read:", error);
      return resolveReminderPreferences(null);
    }),
    hasPushSubscription(userId),
    getSogpDashboardAccess(userId),
  ]);
  const reportsOn = reportRemindersEnabled();
  const reportPreference = reportsOn ? (await db.select({ pushEnabled: dailyReportPreferences.pushEnabled }).from(dailyReportPreferences).where(eq(dailyReportPreferences.userId, userId)))[0] : null;

  return (
    <DashboardPageFrame className="grid max-w-[46rem] gap-6">
      <DashboardPageHeader title="Notifications and reminders" />
      <SetupSteps
        view={toReminderSetupView(preferences)}
        hasPushOnAnyDevice={hasPushOnAnyDevice}
        enrolled={access.isSogpEnrolled}
        continueHref="/dashboard/profile"
        continueLabel="Back to Profile"
        // Passed as props so the step components never import the actions
        // file themselves.
        actions={{
          saveTeachingTime: saveTeachingTimeAction,
          saveReminderPreferences: saveReminderPreferencesAction,
          markAppInstalled: markAppInstalledAction,
        }}
      />
      {reportsOn ? <ReportReminderForm pushEnabled={reportPreference?.pushEnabled ?? false} /> : null}
    </DashboardPageFrame>
  );
}
