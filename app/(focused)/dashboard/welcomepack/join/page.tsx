import { WelcomePackJoinPage } from "@/components/dashboard/welcome-pack-pages";
import { requireWelcomePackAccess } from "@/lib/welcome-pack-dashboard-access";
import {
  getOrientationSurveyStatus,
  getSogpEnrollmentTelegramUrl,
} from "@/lib/db/queries/sogp-journey";
import {
  WELCOME_PACK_JOIN_POSTER_SRC,
  WELCOME_PACK_JOIN_VIDEO_SRC,
} from "@/lib/welcome-pack-hub";

export default async function DashboardWelcomePackJoinPage() {
  const { userId } = await requireWelcomePackAccess();
  const [telegramUrl, surveyStatus] = await Promise.all([
    getSogpEnrollmentTelegramUrl(userId),
    getOrientationSurveyStatus(userId),
  ]);
  const configuredVideoSrc = process.env.WELCOME_PACK_JOIN_VIDEO_URL?.trim();
  const videoSrc = configuredVideoSrc || WELCOME_PACK_JOIN_VIDEO_SRC;

  return (
    <WelcomePackJoinPage
      telegramUrl={telegramUrl}
      videoSrc={videoSrc}
      videoPosterSrc={
        configuredVideoSrc ? null : WELCOME_PACK_JOIN_POSTER_SRC
      }
      surveyCompleted={surveyStatus.completed}
    />
  );
}
