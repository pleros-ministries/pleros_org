import { redirect } from "next/navigation";

import { WelcomeAudiobookPage } from "@/components/dashboard/welcome-audiobook-page";
import { getAppSession } from "@/lib/app-session";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function DashboardWelcomeAudiobookPage() {
  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/login?returnTo=/dashboard/welcomepack/audiobook");
  }

  return <WelcomeAudiobookPage />;
}
