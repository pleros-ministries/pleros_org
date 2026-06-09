"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { confirmWelcomePackShare } from "@/lib/db/queries/welcome-pack-leads";
import { sendWelcomePackExtrasUnlockedEmail } from "@/lib/email/send";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

export async function confirmWelcomePackShareAction() {
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!welcomeSession) {
    redirect("/welcome");
  }

  const lead = await confirmWelcomePackShare(welcomeSession.email);
  const dashboardUrl = `${resolvePublicSiteUrl(process.env)}/dashboard/welcomepack`;

  void sendWelcomePackExtrasUnlockedEmail({
    to: lead.email,
    name: lead.name ?? welcomeSession.name,
    dashboardUrl,
  }).catch((err) => {
    console.error("Failed to send welcome pack extras email:", err);
  });

  revalidatePath("/dashboard/welcomepack");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/welcome-pack");
  redirect("/dashboard/welcomepack");
}
