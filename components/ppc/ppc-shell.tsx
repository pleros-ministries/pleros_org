"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BellRing,
  ClipboardCheck,
  Dot,
  FolderKanban,
  GraduationCap,
  Lock,
  Menu,
  LogOut,
  LayoutDashboard,
  MessageSquareText,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react";

import type { AppSession } from "@/lib/app-session";
import { getRoleDefaultPath } from "@/lib/app-access";
import { authClient } from "@/lib/auth/auth-client";
import { resolvePpcHref } from "@/lib/ppc-navigation";
import {
  getLogicalPpcShellPath,
  getPpcShellContext,
  getVisiblePpcShellNavItems,
  isPpcShellNavItemActive,
  isStudentLevelNavItemActive,
  type PpcShellIcon,
  type PpcShellNavItem,
  type PpcStudentLevelNavItem,
} from "@/lib/ppc-shell";
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
  studentLevelNavItems?: PpcStudentLevelNavItem[];
};

type SidebarNavigationProps = {
  items: PpcShellNavItem[];
  pathname: string;
  logicalPathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
};

const iconMap: Record<PpcShellIcon, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  admin: BadgeCheck,
  content: FolderKanban,
  students: Users,
  review: ClipboardCheck,
  qa: MessageSquareText,
  notifications: BellRing,
  learning: NotebookPen,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getSignOutHref(pathname: string): string {
  if (pathname.startsWith("/admin")) {
    return "/admin";
  }

  return "/ppc";
}

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
        const isActive = isPpcShellNavItemActive(item.path, logicalPathname);
        const Icon = iconMap[item.icon];

        return (
          <Link
            key={item.label}
            href={href}
            title={collapsed ? item.label : undefined}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "group relative flex min-h-11 items-center rounded-xl border text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70",
              collapsed ? "justify-center px-0" : "gap-3 px-3.5 py-2.5",
              isActive
                ? "border-zinc-950 bg-zinc-950 text-white shadow-sm visited:text-white [&_span]:text-white [&_svg]:text-white"
                : "border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100",
            )}
          >
            {!collapsed ? (
              <span
                className={cn(
                  "absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full transition-colors",
                  isActive ? "bg-white/80" : "bg-transparent group-hover:bg-zinc-300",
                )}
              />
            ) : null}
            <Icon className="size-4 shrink-0" />
            {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

type StudentLevelNavigationProps = {
  items: PpcStudentLevelNavItem[];
  logicalPathname: string;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
};

function StudentLevelNavigation({
  items,
  logicalPathname,
  pathname,
  collapsed,
  onNavigate,
}: StudentLevelNavigationProps) {
  return (
    <div className={cn("px-3", collapsed ? "pb-3" : "pb-4")}>
      {!collapsed ? (
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Levels
        </p>
      ) : null}
      <div className="mt-2 grid gap-1.5">
        {items.map((item) => {
          const isActive = isStudentLevelNavItemActive(item.id, logicalPathname);
          const href = item.href ? resolvePpcHref(pathname, item.href) : undefined;

          const badge = (
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold transition-colors",
                collapsed ? "size-10" : "size-8",
                item.state === "current"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : item.state === "completed"
                    ? "border-zinc-200 bg-white text-zinc-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-400",
              )}
            >
              {item.state === "locked" ? <Lock className="size-3.5" /> : `L${item.id}`}
            </span>
          );

          if (!href) {
            return (
              <div
                key={item.id}
                title={collapsed ? `${item.label} locked` : undefined}
                className={cn(
                  "group relative flex min-h-11 items-center rounded-xl border border-zinc-100 bg-zinc-50 text-zinc-400",
                  collapsed ? "justify-center px-0" : "gap-3 px-2.5 py-2",
                )}
              >
                {badge}
                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-zinc-400">
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-zinc-400">
                      {item.description}
                    </span>
                  </span>
                ) : (
                  <span className="sr-only">{item.label} locked</span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={href}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "group relative flex min-h-11 items-center rounded-xl border transition-[background-color,border-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70",
                collapsed ? "justify-center px-0" : "gap-3 px-2.5 py-2",
                isActive
                  ? "border-zinc-950 bg-zinc-950 text-white shadow-sm"
                  : item.state === "current"
                    ? "border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100"
                    : "border-transparent bg-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900",
              )}
            >
              {badge}
              {!collapsed ? (
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-xs font-medium",
                      isActive ? "text-white" : "text-zinc-900",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "block truncate text-[11px]",
                      isActive ? "text-white/70" : "text-zinc-500",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              ) : (
                <span className="sr-only">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

type SidebarFooterProps = {
  collapsed: boolean;
  session: AppSession;
  signOutHref: string;
};

function SidebarFooter({ collapsed, session, signOutHref }: SidebarFooterProps) {
  return (
    <div className={cn("mt-auto border-t border-zinc-100", collapsed ? "px-2 py-3" : "px-3 py-3")}>
      {collapsed ? (
        <div className="grid justify-items-center gap-2">
          <div
            title={`${session.user.name} (${session.user.role})`}
            className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700"
          >
            {getInitials(session.user.name)}
          </div>
          <button
            type="button"
            title="Sign out"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = signOutHref;
            }}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <LogOut className="size-4" />
            <span className="sr-only">Sign out</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700">
              {getInitials(session.user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-zinc-900">
                {session.user.name}
              </p>
              <p className="text-[11px] capitalize text-zinc-500">
                {session.user.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = signOutHref;
            }}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

type SidebarShellProps = {
  pathname: string;
  logicalPathname: string;
  collapsed: boolean;
  session: AppSession;
  studentLevelNavItems?: PpcStudentLevelNavItem[];
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  signOutHref: string;
};

function SidebarShell({
  pathname,
  logicalPathname,
  collapsed,
  session,
  studentLevelNavItems,
  onNavigate,
  onToggleCollapse,
  signOutHref,
}: SidebarShellProps) {
  const visibleNavItems = getVisiblePpcShellNavItems(session.user.role);
  const homeHref = getRoleDefaultPath(session.user.role);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("border-b border-zinc-100", collapsed ? "px-2 py-3" : "px-3 py-3")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-3")}>
          <Link
            href={homeHref}
            onClick={onNavigate}
            className={cn(
              "group flex min-w-0 items-center rounded-2xl transition-colors hover:bg-zinc-50",
              collapsed ? "justify-center p-1.5" : "gap-3 p-1.5",
            )}
            title={collapsed ? "PPC platform" : undefined}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-950 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              PP
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  PPC platform
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                  {session.user.role === "student" ? "Learning workspace" : "Admin workspace"}
                  <Dot className="size-3 text-zinc-300" />
                </span>
              </span>
            ) : null}
          </Link>

          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                "hidden shrink-0 rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 lg:inline-flex",
                collapsed ? "size-10 items-center justify-center" : "size-10 items-center justify-center",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      <SidebarNavigation
        items={visibleNavItems}
        pathname={pathname}
        logicalPathname={logicalPathname}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      {session.user.role === "student" && studentLevelNavItems?.length ? (
        <StudentLevelNavigation
          items={studentLevelNavItems}
          pathname={pathname}
          logicalPathname={logicalPathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ) : null}

      <SidebarFooter
        collapsed={collapsed}
        session={session}
        signOutHref={signOutHref}
      />
    </div>
  );
}

export function PpcShell({
  children,
  session,
  studentLevelNavItems,
}: PpcShellProps) {
  const pathname = usePathname();
  const logicalPathname = getLogicalPpcShellPath(pathname);
  const shellContext = getPpcShellContext(logicalPathname);
  const signOutHref = getSignOutHref(pathname);
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
    <div className="min-h-screen bg-zinc-100/80 text-zinc-900">
      <div
        className={cn(
          "mx-auto min-h-screen w-full max-w-[1520px] grid-cols-1 gap-3 p-3 lg:grid lg:gap-4 lg:p-4",
          isSidebarCollapsed
            ? "lg:grid-cols-[92px_minmax(0,1fr)]"
            : "lg:grid-cols-[282px_minmax(0,1fr)]",
        )}
      >
        <aside
          className={cn(
            "hidden lg:flex",
            hasLoadedSidebarPreference ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="sticky top-4 h-[calc(100vh-2rem)] w-full">
            <div className="flex h-full flex-col rounded-[1.5rem] border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,40,0.04),0_12px_28px_rgba(15,23,40,0.06)]">
              <SidebarShell
                pathname={pathname}
                logicalPathname={logicalPathname}
                collapsed={isSidebarCollapsed}
                session={session}
                studentLevelNavItems={studentLevelNavItems}
                signOutHref={signOutHref}
                onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
              />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <header className="sticky top-3 z-20 flex min-h-15 items-center justify-between rounded-[1.5rem] border border-zinc-200/90 bg-white/95 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,40,0.04),0_8px_22px_rgba(15,23,40,0.04)] backdrop-blur sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="size-4" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {shellContext.label}
                </p>
                <p className="truncate text-xs text-zinc-500 sm:text-sm">
                  {shellContext.description}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-[11px] text-zinc-500 lg:flex">
              <GraduationCap className="size-3.5 text-zinc-400" />
              <span className="capitalize">{session.user.role}</span>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-1 pb-4 sm:px-2">{children}</main>
        </div>
      </div>

      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[88vw] max-w-[320px] p-0"
          showCloseButton
        >
          <SidebarShell
            pathname={pathname}
            logicalPathname={logicalPathname}
            collapsed={false}
            session={session}
            studentLevelNavItems={studentLevelNavItems}
            signOutHref={signOutHref}
            onNavigate={() => setIsMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
