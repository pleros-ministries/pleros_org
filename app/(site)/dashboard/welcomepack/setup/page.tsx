import {
  markAppInstalledAction,
  saveReminderPreferencesAction,
  saveTeachingTimeAction,
} from "@/app/_actions/notification-preferences-actions";
import { WelcomePackSetupPage } from "@/components/dashboard/welcome-pack-pages";
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

// Kept outside the component: reading the clock is not a pure render step.
function cohortHasStarted(startsAt: Date | null) {
  return !startsAt || startsAt.getTime() <= Date.now();
}

export default async function DashboardWelcomePackSetupPage() {
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

  // Where the learner goes next: preparation until their cohort starts, the
  // SOGP dashboard after that, and the main dashboard if they are not enrolled.
  const continueTo = !access.isSogpEnrolled
    ? { href: "/dashboard", label: "Back to your dashboard" }
    : cohortHasStarted(access.startsAt)
      ? { href: "/dashboard/sogp", label: "Open your SOGP dashboard" }
      : { href: "/dashboard/pre-sogp", label: "Continue to Pre-SOGP" };

  return (
    <WelcomePackSetupPage>
      <SetupSteps
        view={toReminderSetupView(preferences)}
        hasPushOnAnyDevice={hasPushOnAnyDevice}
        enrolled={access.isSogpEnrolled}
        continueHref={continueTo.href}
        continueLabel={continueTo.label}
        // Passed as props so the step components never import the actions
        // file themselves.
        actions={{
          saveTeachingTime: saveTeachingTimeAction,
          saveReminderPreferences: saveReminderPreferencesAction,
          markAppInstalled: markAppInstalledAction,
        }}
      />
    </WelcomePackSetupPage>
  );
}
