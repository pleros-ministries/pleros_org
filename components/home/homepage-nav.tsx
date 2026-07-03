"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";

import {
  homeDesktopNavGroups,
  homeDesktopNavStandaloneLinks,
  homeFooterNavGroups,
} from "../../lib/site-homepage-content";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { HomepageNavDropdown } from "./homepage-nav-dropdown";

export function HomepageNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-font-theme bg-[var(--color-brand-blue)] text-white">
      <div className="site-shell-bar-inner flex h-12 items-center justify-between gap-3 md:h-14 lg:h-[3.75rem] lg:gap-4">
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

        <nav
          aria-label="Main"
          className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 lg:flex xl:gap-1"
        >
          {homeDesktopNavStandaloneLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="site-desktop-nav-link rounded-[var(--radius-pill)] px-2.5 py-2 text-[0.8125rem] text-white/88 transition-colors duration-150 hover:bg-white/12 hover:text-white xl:px-3"
            >
              {link.desktopLabel ?? link.label}
            </Link>
          ))}
          {homeDesktopNavGroups.map((group) => (
            <HomepageNavDropdown key={group.label} group={group} />
          ))}
        </nav>

        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label="Open menu"
                  className="-mr-2 inline-flex h-9 w-9 items-center justify-center text-white transition-opacity duration-150 hover:opacity-80 md:-mr-1 md:h-10 md:w-10"
                />
              }
            >
              <MenuIcon className="size-6 stroke-[2.2] md:size-[1.65rem]" />
            </SheetTrigger>

            <SheetContent
              side="right"
              showCloseButton={false}
              className="site-font-theme border-l border-white/8 bg-[var(--color-brand-blue)] px-4 pb-7 pt-4 text-white shadow-[-18px_0_40px_rgba(1,21,133,0.28)]"
            >
              <SheetHeader className="mb-4 border-b border-white/14 pb-3 pr-0">
                <div className="flex items-center justify-between gap-4">
                  <SheetTitle className="site-mobile-menu-title text-left text-white">
                    Menu
                  </SheetTitle>
                  <SheetClose
                    render={
                      <button
                        type="button"
                        aria-label="Close menu"
                        className="inline-flex h-9 w-9 items-center justify-center text-white transition-opacity duration-150 hover:opacity-80 md:h-10 md:w-10"
                      />
                    }
                  >
                    <XIcon className="size-5 stroke-[2.2] text-white" />
                  </SheetClose>
                </div>
              </SheetHeader>

              <nav className="grid gap-5">
                {homeFooterNavGroups.map((group) => (
                  <div key={group.label} className="grid gap-1.5">
                    <p className="site-mobile-menu-group-label">{group.label}</p>
                    <div className="grid gap-0.5">
                      {group.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="site-mobile-menu-link border-b border-white/10 py-2.5 font-medium text-white/94 transition-colors duration-150 hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
