import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-white/70">
      <div className="container-pleros flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-[var(--color-text-strong)]">
            Pleros UI foundations
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Temporary shell, primitive layer, and style reference for the future site.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <Link href="/style-demo" className="hover:text-[var(--color-brand-blue)]">
            Style demo
          </Link>
          <Link href="/ppc" className="hover:text-[var(--color-brand-blue)]">
            PPC sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
