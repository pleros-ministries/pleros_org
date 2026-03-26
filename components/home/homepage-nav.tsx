"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { homeNavLinks } from "../../lib/site-homepage-content";

export function HomepageNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-[var(--color-brand-blue)] text-white">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-[36.1875rem] items-center justify-between px-5">
        <Link href="/" aria-label="Pleros home" className="inline-flex items-center">
          <Image
            src="/site/home/assets/pleros-wordmark.png"
            alt="Pleros"
            width={95}
            height={46}
            className="h-[2.1rem] w-auto"
            priority
          />
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-10 w-10 items-center justify-center text-white transition-opacity duration-150 hover:opacity-80"
              />
            }
          >
            <MenuIcon className="size-[1.65rem] stroke-[2.2]" />
          </SheetTrigger>

          <SheetContent
            side="right"
            showCloseButton={false}
            className="site-font-theme border-l border-white/8 bg-[var(--color-brand-blue)] px-5 pb-8 pt-5 text-white shadow-[-18px_0_40px_rgba(1,21,133,0.28)]"
          >
            <SheetHeader className="mb-5 border-b border-white/14 pb-4 pr-0">
              <div className="flex items-center justify-between gap-4">
                <SheetTitle className="site-mobile-menu-title text-left text-white">
                  Menu
                </SheetTitle>
                <SheetClose
                  render={
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="inline-flex h-10 w-10 items-center justify-center text-white transition-opacity duration-150 hover:opacity-80"
                    />
                  }
                >
                  <XIcon className="size-5 stroke-[2.2] text-white" />
                </SheetClose>
              </div>
            </SheetHeader>

            <nav className="grid gap-0.5">
              {homeNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="site-mobile-menu-link border-b border-white/10 py-3 font-medium text-white/94 transition-colors duration-150 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
