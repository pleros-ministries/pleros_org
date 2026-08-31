"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { betterAuthServer } from "@/lib/auth/better-auth";

export async function signOutDashboardAction() {
  await betterAuthServer.api.signOut({
    headers: await headers(),
  });

  redirect("/login");
}
