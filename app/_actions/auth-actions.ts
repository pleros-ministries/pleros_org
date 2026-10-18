"use server";

import { headers } from "next/headers";

import { betterAuthServer } from "@/lib/auth/better-auth";

/**
 * Clears the Better Auth session. The caller then does a full page load to
 * /login (not a client navigation): with Cache Components, hidden dashboard
 * pages keep their state, and a full reload drops it so the next person on a
 * shared phone can't navigate back into it.
 */
export async function signOutDashboardAction(): Promise<void> {
  await betterAuthServer.api.signOut({
    headers: await headers(),
  });
}
