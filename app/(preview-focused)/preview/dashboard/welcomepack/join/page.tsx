import type { Metadata } from "next";

import { WelcomePackJoinPage } from "@/components/dashboard/welcome-pack-pages";

export const metadata: Metadata = {
  title: "Welcome message preview",
  robots: { index: false, follow: false },
};

export default function WelcomePackJoinPreviewPage() {
  return (
    <WelcomePackJoinPage
      telegramUrl="https://t.me/pleros_sogp"
      videoSrc={null}
    />
  );
}
