import { WelcomePackSetupPage } from "@/components/dashboard/welcome-pack-pages";
import { SetupSteps } from "@/components/dashboard/welcome-pack-setup/setup-steps";
import {
  DEFAULT_REMINDER_PREFERENCES,
  toReminderSetupView,
} from "@/lib/notifications/reminder-preferences";

export default function WelcomePackSetupPreviewPage() {
  return (
    <WelcomePackSetupPage>
      {/* No actions are passed: the preview saves nothing and sends nothing. */}
      <SetupSteps
        view={toReminderSetupView(DEFAULT_REMINDER_PREFERENCES)}
        hasPushOnAnyDevice={false}
        enrolled
        continueHref="/preview/dashboard/welcomepack"
        continueLabel="Back to the Welcome Pack"
        preview
      />
    </WelcomePackSetupPage>
  );
}
