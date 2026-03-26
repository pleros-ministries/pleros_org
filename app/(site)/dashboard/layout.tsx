import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!welcomeSession) {
    redirect("/");
  }

  return <AppShell>{children}</AppShell>;
}
