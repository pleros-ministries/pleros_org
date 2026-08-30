import { WelcomePackGiftsPage } from "@/components/dashboard/welcome-pack-pages";
import { requireWelcomePackAccess } from "@/lib/welcome-pack-dashboard-access";

export default async function DashboardWelcomePackGiftsPage() {
  const access = await requireWelcomePackAccess();
  return (
    <WelcomePackGiftsPage
      extraGiftsUnlocked={access.extraGiftsUnlocked}
    />
  );
}
