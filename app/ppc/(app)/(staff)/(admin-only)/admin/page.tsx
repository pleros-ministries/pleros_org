import Link from "next/link";

export default function PpcAdminPage() {
  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Admin Controls</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Publishing, role assignments, and level progression overrides.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900">Content publishing</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Draft and publish lessons. New publish replaces content globally.
          </p>
          <Link
            href="/ppc/admin/content"
            className="mt-4 inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Open content workflow
          </Link>
        </article>

        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900">Staff access</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Assign instructors by level and limit visibility to active students in scope.
          </p>
        </article>

        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900">Overrides + audit</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Manual graduation override requires reason and writes audit records.
          </p>
        </article>
      </section>
    </div>
  );
}
