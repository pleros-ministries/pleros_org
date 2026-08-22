import { cookies } from "next/headers";

import { getAppSession, type AppSession } from "@/lib/app-session";
import { resolveDbUserId } from "@/lib/app-user";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { provisionWelcomeSession } from "@/lib/welcome-session";

export async function getDashboardActionSession(): Promise<AppSession | null> {
  const appSession = await getAppSession();

  if (appSession) {
    return appSession;
  }

  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!welcomeSession) {
    return null;
  }

  try {
    const user = await provisionWelcomeSession({
      email: welcomeSession.email,
      name: welcomeSession.name,
    });
    const dbUserId = (await resolveDbUserId(user.email)) ?? user.id;

    return {
      user: {
        id: dbUserId,
        name: user.name,
        email: user.email,
        role: "student",
      },
    };
  } catch {
    return null;
  }
}
