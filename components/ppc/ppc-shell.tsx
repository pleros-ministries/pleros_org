"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BellRing,
  ClipboardCheck,
  Menu,
  LogOut,
  LayoutDashboard,
  Layers3,
  MessageSquareText,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react";

import type { AppSession } from "@/lib/app-session";
import { authClient } from "@/lib/auth/auth-client";
import { resolvePpcHref } from "@/lib/ppc-navigation";
import {
  parseSidebarCollapsedState,
  PPC_SIDEBAR_STORAGE_KEY,
  serializeSidebarCollapsedState,
} from "@/lib/ppc-shell-state";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type PpcShellProps = {
  children: React.ReactNode;
  session: AppSession;
};

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AppSession["user"]["role"][];
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    roles: ["admin", "instructor"],
  },
  {
    label: "Admin",
    path: "/admin",
    icon: BadgeCheck,
    roles: ["admin"],
  },
  {
    label: "Content",
    path: "/admin/content",
    icon: Layers3,
    roles: ["admin"],
  },
  {
    label: "Students",
    path: "/students",
    icon: Users,
    roles: ["admin", "instructor"],
  },
  {
    label: "Review Queue",
    path: "/review",
    icon: ClipboardCheck,
    roles: ["admin", "instructor"],
  },
  {
    label: "Q&A Inbox",
    path: "/qa",
    icon: MessageSquareText,
    roles: ["admin", "instructor"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: BellRing,
    roles: ["admin", "instructor"],
  },
  {
    label: "My Learning",
    path: "/student",
    icon: NotebookPen,
    roles: ["student"],
  },
];

function getLogicalPathname(pathname: string): string {
  if (!pathname.startsWith("/ppc")) {
    return pathname;
  }

  const logicalPath = pathname.slice(4);

  if (!logicalPath) {
    return "/";
  }

  return logicalPath;
}

type SidebarNavigationProps = {
  items: NavItem[];
  pathname: string;
  logicalPathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
};

function SidebarNavigation({
  items,
  pathname,
  logicalPathname,
  collapsed,
  onNavigate,
}: SidebarNavigationProps) {
  return (
    <nav className="grid gap-1 px-3 py-4">
      {items.map((item) => {
        const href = resolvePpcHref(pathname, item.path);
        const isActive =
          item.path === "/"
            ? logicalPathname === "/"
            : logicalPathname.startsWith(item.path);
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={href}
            title={collapsed ? item.label : undefined}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70",
              collapsed ? "justify-center" : "gap-3",
              isActive
                ? "bg-zinc-900 text-white visited:text-white [&_span]:text-white [&_svg]:text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 active:text-zinc-950",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function PpcShell({ children, session }: PpcShellProps) {
  const pathname = usePathname();
  const logicalPathname = getLogicalPathname(pathname);
  const visibleNavItems = navItems.filter((item) => item.roles.includes(session.user.role));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasLoadedSidebarPreference, setHasLoadedSidebarPreference] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(PPC_SIDEBAR_STORAGE_KEY);
      setIsSidebarCollapsed(parseSidebarCollapsedState(storedValue));
    } catch {
      setIsSidebarCollapsed(false);
    } finally {
      setHasLoadedSidebarPreference(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSidebarPreference) {
      return;
    }

    try {
      window.localStorage.setItem(
        PPC_SIDEBAR_STORAGE_KEY,
        serializeSidebarCollapsedState(isSidebarCollapsed),
      );
    } catch {
      // Ignore storage errors and keep in-memory preference.
    }
  }, [hasLoadedSidebarPreference, isSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div
        className={cn(
          "mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1",
          isSidebarCollapsed
            ? "lg:grid-cols-[88px_minmax(0,1fr)]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]",
        )}
      >
        <aside className="hidden border-zinc-200 bg-white lg:flex lg:flex-col lg:border-r">
          <div className={cn("border-b border-zinc-200", isSidebarCollapsed ? "px-2 py-5" : "px-5 py-5")}>
            <p
              className={cn(
                "text-[11px] font-semibold uppercase text-zinc-500",
                isSidebarCollapsed ? "text-center tracking-[0.14em]" : "tracking-[0.18em]",
              )}
            >
              {isSidebarCollapsed ? "PPC" : "Pleros Perfecting"}
            </p>
            <h1
              className={cn(
                "mt-2 text-xl font-semibold tracking-tight text-zinc-900",
                isSidebarCollapsed && "sr-only",
              )}
            >
              PPC Admin
            </h1>
          </div>

          <SidebarNavigation
            items={visibleNavItems}
            pathname={pathname}
            logicalPathname={logicalPathname}
            collapsed={isSidebarCollapsed}
          />
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5 lg:px-7">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="inline-flex size-9 items-center justify-center rounded-sm border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                className="hidden size-9 items-center justify-center rounded-sm border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 lg:inline-flex"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </button>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                Course Operations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {session.user.name} ({session.user.role})
              </div>
              <button
                type="button"
                onClick={async () => {
                  await authClient.signOut();
                  window.location.href = "/ppc/sign-in";
                }}
                className="inline-flex h-8 items-center gap-1 rounded-sm border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-5 py-6 lg:px-7">{children}</main>
        </div>
      </div>

      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent side="left" className="w-[86%] max-w-[320px] p-0" showCloseButton>
          <div className="border-b border-zinc-200 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Pleros Perfecting
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
              PPC Admin
            </h1>
          </div>
          <SidebarNavigation
            items={visibleNavItems}
            pathname={pathname}
            logicalPathname={logicalPathname}
            collapsed={false}
            onNavigate={() => setIsMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
