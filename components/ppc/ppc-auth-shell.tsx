import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type PpcAuthShellProps = {
  children: ReactNode;
};

export function PpcAuthShell({ children }: PpcAuthShellProps) {
  return (
    <div className="ppc-theme flex min-h-screen flex-col bg-zinc-50">
      <header className="pleros-nav">
        <div className="flex h-12 w-full items-center justify-between gap-3 px-5 md:h-14 lg:h-[3.75rem] lg:px-8">
          <Link href="/" aria-label="Pleros home" className="inline-flex shrink-0 items-center">
            <Image
              src="/site/home/assets/white-pleros-logomark.png"
              alt="Pleros"
              width={2067}
              height={1016}
              className="h-[1.65rem] w-auto md:h-[1.85rem] lg:h-[2rem]"
              priority
            />
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-white/80 transition-colors hover:text-white"
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
