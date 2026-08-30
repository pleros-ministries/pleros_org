import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAppSession } from "./app-session";
import { getWelcomePackLeadByEmail } from "./db/queries/welcome-pack-leads";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "./welcome-access";

export async function requireWelcomePackAccess() {
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (welcomeSession) {
    const lead = await getWelcomePackLeadByEmail(welcomeSession.email);
    return {
      email: welcomeSession.email,
      extraGiftsUnlocked: lead?.extraGiftsUnlocked ?? false,
    };
  }

  const appSession = await getAppSession();
  if (!appSession) redirect("/welcome");
  const lead = await getWelcomePackLeadByEmail(appSession.user.email);
  return {
    email: appSession.user.email,
    extraGiftsUnlocked: lead?.extraGiftsUnlocked ?? false,
  };
}
