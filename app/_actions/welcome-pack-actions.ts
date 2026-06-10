"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { confirmWelcomePackShare } from "@/lib/db/queries/welcome-pack-leads";
import { sendWelcomePackExtrasUnlockedEmail } from "@/lib/email/send";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

export async function confirmWelcomePackShareAction() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );
  const email = appSession?.user.email ?? welcomeSession?.email;
  const name = appSession?.user.name ?? welcomeSession?.name;

  if (!email || !name) {
    redirect("/welcome");
  }

  const lead = await confirmWelcomePackShare(email);
  const dashboardUrl = `${resolvePublicSiteUrl(process.env)}/dashboard/welcomepack`;

  void sendWelcomePackExtrasUnlockedEmail({
    to: lead.email,
    name: lead.name ?? name,
    dashboardUrl,
  }).catch((err) => {
    console.error("Failed to send welcome pack extras email:", err);
  });

  revalidatePath("/dashboard/welcomepack");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/welcome-pack");
  redirect("/dashboard/welcomepack");
}
