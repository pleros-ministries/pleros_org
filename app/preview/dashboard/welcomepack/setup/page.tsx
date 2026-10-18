import { connection } from "next/server";
import { WelcomePackSetupPage } from "@/components/dashboard/welcome-pack-pages";
import { SetupSteps } from "@/components/dashboard/welcome-pack-setup/setup-steps";
import {
  DEFAULT_REMINDER_PREFERENCES,
  toReminderSetupView,
} from "@/lib/notifications/reminder-preferences";

// Cache Components: synthetic demo reads the clock, so it renders per request.
export const instant = false;

export default async function WelcomePackSetupPreviewPage() {
  await connection();
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
