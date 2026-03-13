import Link from "next/link";

import { isDemoAuthEnabled } from "@/lib/demo-auth-session";

type SignInPageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnTo = params.returnTo?.startsWith("/") ? params.returnTo : "/";
  const demoMode = isDemoAuthEnabled();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          PPC Demo Auth
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
          Sign in to dashboard
        </h1>
        {demoMode ? (
          <>
            <p className="mt-1 text-sm text-zinc-600">
              Demo-only mode. Pick a role to preview route guards and role-based
              navigation.
            </p>

            <form action="/api/ppc/demo-auth/login" method="post" className="mt-5 grid gap-3">
              <input type="hidden" name="returnTo" value={returnTo} />

              <label className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                  Full name
                </span>
                <input
                  name="name"
                  required
                  defaultValue="Demo User"
                  className="h-11 rounded border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-700"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue="demo@pleros.test"
                  className="h-11 rounded border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-700"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                  Role
                </span>
                <select
                  name="role"
                  defaultValue="admin"
                  className="h-11 rounded border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-700"
                >
                  <option value="admin">Admin</option>
                  <option value="instructor">Instructor/Reviewer</option>
                  <option value="student">Student</option>
                </select>
              </label>

              <button
                type="submit"
                className="mt-2 h-11 rounded bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <div className="mt-5 grid gap-3 rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            <p>
              Better Auth mode is enabled. Use configured auth endpoints under
              <code className="ml-1 rounded bg-zinc-200 px-1.5 py-0.5 text-xs">/api/auth</code>.
            </p>
            <p>
              If you want to keep demo login for client walkthroughs, set
              <code className="ml-1 rounded bg-zinc-200 px-1.5 py-0.5 text-xs">DEMO_AUTH=true</code>.
            </p>
          </div>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          Website front-end remains at <Link href="/" className="underline">home</Link>.
        </p>
      </section>
    </main>
  );
}
