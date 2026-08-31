import "server-only";

import { redirect } from "next/navigation";

import { getAppSession } from "./app-session";
import { getWelcomePackLeadByEmail } from "./db/queries/welcome-pack-leads";

export async function requireWelcomePackAccess() {
  const appSession = await getAppSession();
  if (!appSession) redirect("/login?returnTo=/dashboard/welcomepack");
  const lead = await getWelcomePackLeadByEmail(appSession.user.email);
  return {
    email: appSession.user.email,
    extraGiftsUnlocked: lead?.extraGiftsUnlocked ?? false,
  };
}
