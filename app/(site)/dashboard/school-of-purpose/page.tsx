import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SchoolOfPurposePage } from "@/components/dashboard/school-of-purpose-page";
import { getAppSession } from "@/lib/app-session";
import { getSchoolOfPurposeWaitlistEntryByEmail } from "@/lib/db/queries/school-of-purpose-waitlist";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function DashboardSchoolOfPurposePage() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!appSession && welcomeSession) {
    redirect("/api/welcome-access/session?returnTo=%2Fdashboard%2Fschool-of-purpose");
  }

  if (!appSession) {
    redirect("/welcome");
  }

  const existingEntry = await getSchoolOfPurposeWaitlistEntryByEmail(
    appSession.user.email,
  );

  return (
    <SchoolOfPurposePage
      existingEntry={
        existingEntry ? { name: existingEntry.name, phone: existingEntry.phone } : null
      }
    />
  );
}
