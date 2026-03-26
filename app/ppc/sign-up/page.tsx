import { cookies } from "next/headers";
import Link from "next/link";

import {
  getWelcomeAccessSecret,
  parseWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { SignUpForm } from "./sign-up-form";

type SignUpPageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const returnTo = params.returnTo?.startsWith("/") ? params.returnTo : "/";
  const cookieStore = await cookies();
  const welcomeToken = cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value;
  const welcomeSession = welcomeToken
    ? parseWelcomeAccessToken(welcomeToken, getWelcomeAccessSecret(process.env))
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          PPC Platform
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
          Create account
        </h1>

        <SignUpForm
          returnTo={returnTo}
          initialEmail={welcomeSession?.email ?? ""}
          lockEmail={Boolean(welcomeSession?.email)}
        />

        <p className="mt-4 text-[11px] text-zinc-400">
          Website front-end remains at <Link href="/" className="underline">home</Link>.
        </p>
      </section>
    </main>
  );
}
