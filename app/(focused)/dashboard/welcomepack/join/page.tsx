import { WelcomePackJoinPage } from "@/components/dashboard/welcome-pack-pages";
import { requireWelcomePackAccess } from "@/lib/welcome-pack-dashboard-access";

export default async function DashboardWelcomePackJoinPage() {
  await requireWelcomePackAccess();
  const videoSrc = process.env.WELCOME_PACK_JOIN_VIDEO_URL?.trim() || null;

  return (
    <WelcomePackJoinPage
      telegramUrl="https://t.me/pleros_sogp"
      videoSrc={videoSrc}
    />
  );
}
