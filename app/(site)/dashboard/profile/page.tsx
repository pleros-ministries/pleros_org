import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import { dailyReportPreferences } from "@/lib/db/schema";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";
import { ProfileSettings } from "@/components/dashboard/profile-settings";
export default async function ProfilePage() {
  const session = await getAppSession(); if (!session) redirect("/login?returnTo=/dashboard/profile");
  const enabled = reportRemindersEnabled();
  const preference = enabled ? (await db.select({ pushEnabled: dailyReportPreferences.pushEnabled }).from(dailyReportPreferences).where(eq(dailyReportPreferences.userId, session.user.id)))[0] : null;
  return <ProfileSettings initialName={session.user.name} initialImage={session.user.image ?? null} reportPreferences={enabled} pushEnabled={preference?.pushEnabled ?? false} />;
}
