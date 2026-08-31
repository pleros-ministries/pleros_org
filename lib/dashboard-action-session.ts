import { getAppSession, type AppSession } from "@/lib/app-session";

export async function getDashboardActionSession(): Promise<AppSession | null> {
  return getAppSession();
}
