import Link from "next/link";

import { isDemoAuthEnabled } from "@/lib/demo-auth-session";

type SignInPageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

const quickAccounts = [
  { name: "Grace Admin", email: "admin@pleros.test", role: "admin", label: "Admin" },
  { name: "James Instructor", email: "instructor@pleros.test", role: "instructor", label: "Instructor" },
  { name: "Ada Lovelace", email: "ada@pleros.test", role: "student", label: "Ada (student)" },
  { name: "Ben Carson", email: "ben@pleros.test", role: "student", label: "Ben (student)" },
];

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnTo = params.returnTo?.startsWith("/") ? params.returnTo : "/";
  const demoMode = isDemoAuthEnabled();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          PPC Platform
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
          Sign in
        </h1>
        {demoMode ? (
          <>
            <p className="mt-1 text-xs text-zinc-500">
              Quick login with a seeded account.
            </p>

            <div className="mt-4 grid gap-2">
              {quickAccounts.map((account) => (
                <form key={account.email} action="/api/ppc/demo-auth/login" method="post">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <input type="hidden" name="name" value={account.name} />
                  <input type="hidden" name="email" value={account.email} />
                  <input type="hidden" name="role" value={account.role} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-between rounded-sm border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <span>{account.label}</span>
                    <span className="text-[10px] text-zinc-400">{account.email}</span>
                  </button>
                </form>
              ))}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-[11px] font-medium text-zinc-400 hover:text-zinc-600">
                Custom login
              </summary>
              <form action="/api/ppc/demo-auth/login" method="post" className="mt-3 grid gap-3">
                <input type="hidden" name="returnTo" value={returnTo} />
                <label className="grid gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Full name
                  </span>
                  <input
                    name="name"
                    required
                    defaultValue="Demo User"
                    className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Email
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue="demo@pleros.test"
                    className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Role
                  </span>
                  <select
                    name="role"
                    defaultValue="admin"
                    className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
                  >
                    <option value="admin">Admin</option>
                    <option value="instructor">Instructor</option>
                    <option value="student">Student</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="mt-1 h-8 rounded bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800"
                >
                  Continue
                </button>
              </form>
            </details>
          </>
        ) : (
          <div className="mt-5 grid gap-3 rounded-sm border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700">
            <p>
              Better Auth mode is enabled. Use configured auth endpoints under
              <code className="ml-1 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px]">/api/auth</code>.
            </p>
          </div>
        )}

        <p className="mt-4 text-[11px] text-zinc-400">
          Website front-end remains at <Link href="/" className="underline">home</Link>.
        </p>
      </section>
    </main>
  );
}
