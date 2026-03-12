"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/questions", label: "Questions" },
  { href: "/purpose", label: "Purpose" },
  { href: "/fulfil", label: "Fulfil" },
  { href: "/healing", label: "Healing" },
  { href: "/library", label: "Library" },
  { href: "/partner", label: "Partner" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="container-pleros flex h-[4.25rem] items-center justify-between gap-4">
      <Link href="/" className="inline-flex items-center" aria-label="Pleros home">
        <Image
          src="/brand/white-logotype.png"
          alt="Pleros Ministries and Missions"
          width={345}
          height={177}
          className="h-8 w-auto sm:h-9"
          priority
        />
      </Link>

      <nav className="hidden items-center gap-1 lg:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-[var(--radius-pill)] px-3 py-2 text-[var(--text-sm)] text-white/90 transition-colors hover:bg-white/12 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
        <Button
          variant="secondary"
          size="sm"
          className="ml-2 border-white/32 bg-white text-[#011585] hover:bg-white/95"
          render={<Link href="/dashboard" />}
        >
          Dashboard
        </Button>
      </nav>

      <div className="lg:hidden">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="border border-white/40 bg-white/12 text-white hover:bg-white/20"
                aria-label="Open menu"
              />
            }
          >
            <MenuIcon />
          </SheetTrigger>

          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            <div className="mt-1 grid gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-[var(--radius-md)] px-3 py-2.5 text-[var(--text-body)] text-[var(--color-text)] transition-colors hover:bg-[var(--page-accent-soft)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 border-t border-[var(--color-line)] pt-4">
              <Button
                variant="primary"
                className="w-full"
                render={<Link href="/dashboard" onClick={() => setMenuOpen(false)} />}
              >
                Dashboard
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
