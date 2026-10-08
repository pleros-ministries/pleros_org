import { WelcomePackHubPage } from "@/components/dashboard/welcome-pack-pages";
import { getReminderPreferences } from "@/lib/db/queries/notification-preferences";
import { requireWelcomePackAccess } from "@/lib/welcome-pack-dashboard-access";

export default async function DashboardWelcomePackPage() {
  const { userId } = await requireWelcomePackAccess();

  // The "Done" chip is a nicety: if preferences cannot be read, show the hub
  // without it rather than failing the whole page.
  let setupComplete = false;
  try {
    const preferences = await getReminderPreferences(userId);
    setupComplete = preferences.remindersSavedAt !== null;
  } catch (error) {
    console.error("Welcome Pack setup status could not be read:", error);
  }

  return <WelcomePackHubPage setupComplete={setupComplete} />;
}
