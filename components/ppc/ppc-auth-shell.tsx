import Link from "next/link";
import type { ReactNode } from "react";

type PpcAuthShellProps = {
  children: ReactNode;
};

export function PpcAuthShell({ children }: PpcAuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-12 w-full max-w-md items-center justify-between px-5">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-zinc-950"
          >
            Pleros
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-5 py-10">
        {children}
      </main>
    </div>
  );
}
