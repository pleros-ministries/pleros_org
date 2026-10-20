import { WelcomePackGiftsPage } from "@/components/dashboard/welcome-pack-pages";
import { requireWelcomePackAccess } from "@/lib/welcome-pack-dashboard-access";

// Reads the session or params on every request (Cache Components).
export const instant = false;

export default async function DashboardWelcomePackGiftsPage() {
  const access = await requireWelcomePackAccess();
  return (
    <WelcomePackGiftsPage
      extraGiftsUnlocked={access.extraGiftsUnlocked}
    />
  );
}
