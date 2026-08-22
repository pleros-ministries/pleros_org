import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PublicSitePageShellProps = {
  children: ReactNode;
  className?: string;
  minHeight?: boolean;
};

export function PublicSitePageShell({
  children,
  className,
  minHeight = false,
}: PublicSitePageShellProps) {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-0 md:py-0">
      <div
        className={cn(
          "mx-auto w-full max-w-none overflow-hidden bg-[var(--color-bg)]",
          minHeight && "min-h-screen",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
