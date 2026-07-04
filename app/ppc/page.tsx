import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { isStaffRole } from "@/lib/app-role";
import { toExternalPpcPath } from "@/lib/ppc-access";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { SignInForm } from "./sign-in/sign-in-form";
import { PpcAuthShell } from "@/components/ppc/ppc-auth-shell";

export default async function PpcEntryPage() {
  const session = await getAppSession();

  if (session?.user.role === "student") {
    redirect("/ppc/student");
  }

  if (session && isStaffRole(session.user.role)) {
    redirect("/admin");
  }

  const cookieStore = await cookies();
  const welcomeAccess = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );
  const requestHeaders = await headers();
  const returnTo = toExternalPpcPath(requestHeaders.get("host"), "/student");

  if (welcomeAccess) {
    redirect(
      `/api/welcome-access/session?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }

  return (
    <PpcAuthShell>
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Student portal
        </p>
        <h1 className="mt-2 ppc-heading text-xl font-semibold text-zinc-950">
          Login
        </h1>

        <SignInForm returnTo={returnTo} />
      </section>
    </PpcAuthShell>
  );
}
