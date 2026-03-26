import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { SignInForm } from "./sign-in/sign-in-form";

export default async function PpcEntryPage() {
  const session = await getAppSession();

  if (session?.user.role === "student") {
    redirect("/ppc/student");
  }

  if (session?.user.role === "admin" || session?.user.role === "instructor") {
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
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Student portal
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
          Login
        </h1>

        <SignInForm returnTo={returnTo} />

        <p className="mt-4 text-[11px] text-zinc-400">
          Website front-end remains at{" "}
          <Link href="/" className="underline">
            home
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
