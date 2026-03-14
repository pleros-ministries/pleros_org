import Link from "next/link";

import { SignInForm } from "./sign-in-form";

type SignInPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnTo = params.returnTo?.startsWith("/") ? params.returnTo : "/";
  const error = params.error;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          PPC Platform
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
          Sign in
        </h1>

        {error && (
          <div className="mt-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error === "invalid" ? "Invalid email or password." : error}
          </div>
        )}

        <SignInForm returnTo={returnTo} />

        <p className="mt-4 text-[11px] text-zinc-400">
          Website front-end remains at <Link href="/" className="underline">home</Link>.
        </p>
      </section>
    </main>
  );
}
