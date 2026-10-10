"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  KeyRoundIcon,
  LoaderCircleIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";

import { signOutDashboardAction } from "@/app/_actions/auth-actions";
import type { DashboardNavSection } from "@/lib/dashboard/navigation";
import { cn } from "@/lib/utils";

import { DashboardNav } from "./dashboard-nav";
import motion from "./dashboard-shell.module.css";
import { compactButton, focusRing } from "./styles";

export type DashboardShellViewer = {
  name: string;
  roleLabel: string;
};

let mountedFrames = 0;
let previousFonts: string[] = [];
let previousDashboardAttribute: string | null = null;

function scopeDocumentTypography() {
  const root = document.documentElement;
  const keys = ["--font-sen", "--font-suisse-intl"];
  if (mountedFrames++ === 0) {
    previousFonts = keys.map((key) => root.style.getPropertyValue(key));
    previousDashboardAttribute = root.getAttribute("data-pleros-dashboard");
    keys.forEach((key) => root.style.setProperty(key, "var(--font-be-vietnam-pro)"));
    root.setAttribute("data-pleros-dashboard", "true");
  }
  return () => {
    if (--mountedFrames > 0) return;
    keys.forEach((key, index) => {
      if (previousFonts[index]) root.style.setProperty(key, previousFonts[index]);
      else root.style.removeProperty(key);
    });
    if (previousDashboardAttribute === null) root.removeAttribute("data-pleros-dashboard");
    else root.setAttribute("data-pleros-dashboard", previousDashboardAttribute);
  };
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Profile({ viewer, onNavigate }: { viewer: DashboardShellViewer; onNavigate?: () => void }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-(--color-brand-sky) text-[13px] font-medium text-(--color-brand-blue)"
      >
        {initials(viewer.name)}
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="break-words text-[13.5px] font-medium leading-snug text-(--color-text-strong)">
          {viewer.name}
        </p>
        <p className="break-words text-[12px] leading-snug text-(--color-text-muted)">
          {viewer.roleLabel}
        </p>
      </div>
      {/* The only account settings that exist today are app and reminders. */}
      <Link
        href="/dashboard/welcomepack/setup"
        onClick={onNavigate}
        aria-label="App and reminder settings"
        title="App and reminder settings"
        className={cn(compactButton, "w-8 shrink-0 px-0 text-(--color-text-muted)")}
      >
        <SettingsIcon className="size-4" strokeWidth={1.75} aria-hidden />
      </Link>
    </div>
  );
}

function SignOutSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cn(compactButton, "flex-1")}>
      {pending ? (
        <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <LogOutIcon className="size-3.5" aria-hidden />
      )}
      {pending ? "Signing out" : "Sign out"}
    </button>
  );
}

function AccountActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex gap-2">
      <Link href="/forgot-password" onClick={onNavigate} className={cn(compactButton, "flex-1")}>
        <KeyRoundIcon className="size-3.5" aria-hidden />
        Password
      </Link>
      <form action={signOutDashboardAction} className="flex flex-1">
        <SignOutSubmit />
      </form>
    </div>
  );
}

function Logo() {
  return (
    <Link
      href="/dashboard"
      aria-label="Pleros dashboard"
      className={cn("inline-flex h-9 items-center rounded-md bg-(--color-brand-blue) px-2.5", focusRing)}
    >
      <Image
        src="/brand/white-logotype.webp"
        alt=""
        width={345}
        height={177}
        className="h-6 w-auto"
        priority
      />
    </Link>
  );
}

function Drawer({
  open,
  onClose,
  viewer,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  viewer: DashboardShellViewer;
  sections: DashboardNavSection[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        motion.drawer,
        "my-0 ml-0 mr-auto h-dvh max-h-dvh w-[min(300px,88vw)] max-w-[300px] border-0 bg-transparent p-0 backdrop:bg-[rgba(6,16,86,0.28)] lg:hidden",
      )}
    >
      <div className="flex h-full flex-col border-r border-(--color-line) bg-white">
        <div className="flex items-start gap-2 border-b border-(--color-line) px-4 py-3.5">
          <h2 id={titleId} className="sr-only">
            Dashboard navigation
          </h2>
          <div className="min-w-0 flex-1">
            <Profile viewer={viewer} onNavigate={onClose} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-md text-(--color-text-muted) hover:bg-(--color-surface-muted)",
              focusRing,
            )}
          >
            <XIcon className="size-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3">
          <DashboardNav sections={sections} onNavigate={onClose} />
        </div>
        <div className="border-t border-(--color-line) px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <AccountActions onNavigate={onClose} />
        </div>
      </div>
    </dialog>
  );
}

/**
 * The signed-in dashboard frame: a left sidebar from `lg`, and below it a
 * compact brand bar whose menu opens the same navigation as a drawer. Pages
 * keep their own width and headers; the shell adds no page padding.
 */
export function DashboardShell({
  viewer,
  sections,
  children,
}: {
  viewer: DashboardShellViewer;
  sections: DashboardNavSection[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menu, setMenu] = useState<{ open: boolean; pathname: string | null }>({
    open: false,
    pathname: null,
  });
  // A navigation closes the drawer even when it did not start from a link in it.
  const menuOpen = menu.open && menu.pathname === pathname;
  const closeMenu = () => setMenu({ open: false, pathname: null });

  // Portal menus sit outside the frame; scope the same font variables to the
  // document while this authenticated shell is mounted, and restore on exit.
  useEffect(scopeDocumentTypography, []);

  // The drawer is hidden from `lg`, so widening the window must not leave an
  // invisible modal blocking the page.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 64rem)");
    const onChange = () => {
      if (wide.matches) setMenu({ open: false, pathname: null });
    };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      className={cn(
        motion.root,
        "site-font-theme min-h-dvh bg-white font-[family-name:var(--font-be-vietnam-pro)] text-(--color-text)",
      )}
    >
      <a
        href="#dashboard-main"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-[13px] focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      {/* 48px tall (`--dashboard-topbar-offset`); pages' sticky headers sit below it. */}
      <header className="sticky top-0 z-40 bg-(--color-brand-blue) text-white lg:hidden">
        <div className="flex h-12 items-center gap-2 px-2 sm:px-4">
          <button
            type="button"
            onClick={() => setMenu({ open: true, pathname })}
            aria-label="Open dashboard navigation"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="grid size-9 shrink-0 place-items-center text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-white"
          >
            <MenuIcon className="size-5" strokeWidth={2} aria-hidden />
          </button>
          <div className="grid min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13.5px] font-medium">{viewer.name}</p>
            <p className="truncate text-[11.5px] text-white/75">{viewer.roleLabel}</p>
          </div>
          <Link
            href="/dashboard"
            aria-label="Pleros dashboard"
            className="inline-flex shrink-0 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Image
              src="/site/home/assets/white-pleros-logomark.webp"
              alt=""
              width={2067}
              height={1016}
              className="h-5 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-(--color-line) bg-white lg:flex">
        <div className="px-4 pb-3 pt-4">
          <Logo />
        </div>
        <div className="mx-3 mb-3 rounded-lg border border-(--color-line) px-3 py-2.5">
          <Profile viewer={viewer} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <DashboardNav sections={sections} />
        </div>
        <div className="border-t border-(--color-line) px-3 py-3">
          <AccountActions />
        </div>
      </aside>

      <Drawer open={menuOpen} onClose={closeMenu} viewer={viewer} sections={sections} />

      <div className="lg:pl-64">
        <main id="dashboard-main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
