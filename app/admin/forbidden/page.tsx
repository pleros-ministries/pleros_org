import Link from "next/link";

export default function AdminForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Access denied
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
          You do not have permission for this area
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Switch to an account with the required access or return to your allowed dashboard.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex h-10 items-center rounded bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Back to admin
          </Link>
          <Link
            href="/ppc"
            className="inline-flex h-10 items-center rounded-sm border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
          >
            Go to student portal
          </Link>
        </div>
      </section>
    </main>
  );
}
