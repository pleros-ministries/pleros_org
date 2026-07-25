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
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (welcomeSession) {
    const existingEntry = await getSchoolOfPurposeWaitlistEntryByEmail(
      welcomeSession.email,
    );

    return (
      <SchoolOfPurposePage
        existingEntry={
          existingEntry ? { name: existingEntry.name, phone: existingEntry.phone } : null
        }
      />
    );
  }

  const appSession = await getAppSession();

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
