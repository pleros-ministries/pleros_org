import { getAppSession, type AppSession } from "@/lib/app-session";
import type { AppRole } from "@/lib/app-role";

export async function requireRole(...allowed: AppRole[]): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) {
    throw new Error("Unauthorized: not signed in");
  }
  if (!allowed.includes(session.user.role)) {
    throw new Error(`Forbidden: ${session.user.role} cannot perform this action`);
  }
  return session;
}

export async function requireStaff(): Promise<AppSession> {
  return requireRole("admin", "instructor");
}

export async function requireAdmin(): Promise<AppSession> {
  return requireRole("admin");
}

export async function requireStudent(): Promise<AppSession> {
  return requireRole("student");
}

export async function requireAuth(): Promise<AppSession> {
  return requireRole("admin", "instructor", "student");
}
