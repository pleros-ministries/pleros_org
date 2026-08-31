import { redirect } from "next/navigation";

import { WelcomeAudiobookPage } from "@/components/dashboard/welcome-audiobook-page";
import { getAppSession } from "@/lib/app-session";

export default async function DashboardWelcomeAudiobookPage() {
  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/login?returnTo=/dashboard/welcomepack/audiobook");
  }

  return <WelcomeAudiobookPage />;
}
