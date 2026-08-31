"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { confirmWelcomePackShare } from "@/lib/db/queries/welcome-pack-leads";
import { sendWelcomePackExtrasUnlockedEmail } from "@/lib/email/send";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

export async function confirmWelcomePackShareAction() {
  const appSession = await getAppSession();
  if (!appSession) {
    redirect("/login?returnTo=/dashboard/welcomepack");
  }

  const email = appSession.user.email;
  const name = appSession.user.name;

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
