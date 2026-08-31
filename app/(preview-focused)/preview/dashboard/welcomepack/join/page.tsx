import type { Metadata } from "next";

import { WelcomePackJoinPage } from "@/components/dashboard/welcome-pack-pages";
import {
  WELCOME_PACK_JOIN_POSTER_SRC,
  WELCOME_PACK_JOIN_VIDEO_SRC,
} from "@/lib/welcome-pack-hub";

export const metadata: Metadata = {
  title: "Welcome message preview",
  robots: { index: false, follow: false },
};

export default function WelcomePackJoinPreviewPage() {
  return (
    <WelcomePackJoinPage
      telegramUrl="https://t.me/pleros_sogp"
      videoSrc={WELCOME_PACK_JOIN_VIDEO_SRC}
      videoPosterSrc={WELCOME_PACK_JOIN_POSTER_SRC}
    />
  );
}
