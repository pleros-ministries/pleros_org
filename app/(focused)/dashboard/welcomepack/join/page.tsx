import { WelcomePackJoinPage } from "@/components/dashboard/welcome-pack-pages";
import { requireWelcomePackAccess } from "@/lib/welcome-pack-dashboard-access";
import {
  WELCOME_PACK_JOIN_POSTER_SRC,
  WELCOME_PACK_JOIN_VIDEO_SRC,
} from "@/lib/welcome-pack-hub";

export default async function DashboardWelcomePackJoinPage() {
  await requireWelcomePackAccess();
  const configuredVideoSrc = process.env.WELCOME_PACK_JOIN_VIDEO_URL?.trim();
  const videoSrc = configuredVideoSrc || WELCOME_PACK_JOIN_VIDEO_SRC;

  return (
    <WelcomePackJoinPage
      telegramUrl="https://t.me/pleros_sogp"
      videoSrc={videoSrc}
      videoPosterSrc={
        configuredVideoSrc ? null : WELCOME_PACK_JOIN_POSTER_SRC
      }
    />
  );
}
