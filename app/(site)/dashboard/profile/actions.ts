"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getAppSession } from "@/lib/app-session";
import { betterAuthServer } from "@/lib/auth/better-auth";
import { db } from "@/lib/db";
import { users, dailyReportPreferences } from "@/lib/db/schema";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";

export async function saveProfile(input: { name: string; image: string | null }) {
  const session = await getAppSession(); if (!session) return { ok: false as const, error: "Sign in to edit your profile." };
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 100) return { ok: false as const, error: "Enter your name using 2–100 characters." };
  if (input.image !== null && input.image !== session.user.image) {
    try { const url = new URL(input.image); if (url.protocol !== "https:" || url.username || url.password || !(url.hostname.endsWith(".ufs.sh") || url.hostname === "utfs.io")) throw new Error(); }
    catch { return { ok: false as const, error: "Upload a profile photo before saving." }; }
  }
  await betterAuthServer.api.updateUser({ headers: await headers(), body: { name, image: input.image } });
  await db.update(users).set({ name }).where(eq(users.id, session.user.id));
  revalidatePath("/dashboard", "layout");
  return { ok: true as const };
}
export async function saveReportPushPreference(enabled: boolean) {
  const session = await getAppSession(); if (!session) return { ok: false as const, error: "Sign in to change reminders." };
  if (!reportRemindersEnabled()) return { ok: false as const, error: "Report reminders are not enabled yet." };
  if (typeof enabled !== "boolean") return { ok: false as const, error: "Choose your reminder preference." };
  await db.insert(dailyReportPreferences).values({ userId: session.user.id, pushEnabled: enabled }).onConflictDoUpdate({ target: dailyReportPreferences.userId, set: { pushEnabled: enabled, updatedAt: new Date() } });
  revalidatePath("/dashboard/profile"); return { ok: true as const };
}
