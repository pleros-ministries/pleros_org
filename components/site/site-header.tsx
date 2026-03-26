"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { siteNavItems } from "@/lib/site-foundations";

function SiteWordmark() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-white text-[0.78rem] font-semibold tracking-[0.12em] text-[var(--color-brand-blue)] shadow-[var(--shadow-sm)]">
        PL
      </span>
      <span className="grid gap-0.5">
        <span className="text-sm font-semibold text-[var(--color-text-strong)]">
          Pleros
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          UI foundations
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[rgba(253,253,252,0.82)] backdrop-blur-xl">
      <div className="container-pleros flex min-h-18 items-center justify-between gap-4 py-3">
        <SiteWordmark />

        <nav className="hidden items-center gap-2 md:flex">
          {siteNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({
                    variant: isActive ? "primary" : "ghost",
                    size: "sm",
                  }),
                  "min-h-10",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Sheet>
            <SheetTrigger
              aria-label="Open site navigation"
              className={cn(
                buttonVariants({ variant: "secondary", size: "icon" }),
                "size-11",
              )}
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right" tone="muted" className="w-[min(100%,22rem)]">
              <SheetHeader>
                <SheetTitle>Explore the foundations</SheetTitle>
                <SheetDescription>
                  Navigation for the temporary marketing shell.
                </SheetDescription>
              </SheetHeader>

              <div className="grid gap-2">
                {siteNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={buttonVariants({
                      variant: pathname === item.href ? "primary" : "secondary",
                      size: "default",
                    })}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Link
          href="/ppc"
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "hidden min-h-10 md:inline-flex",
          )}
        >
          Enter PPC
        </Link>
      </div>
    </header>
  );
}
