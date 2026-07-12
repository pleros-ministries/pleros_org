"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BellRing,
  ClipboardCheck,
  ClipboardList,
  Dot,
  FolderKanban,
  GraduationCap,
  Globe,
  Lock,
  Menu,
  LogOut,
  LayoutDashboard,
  Mail,
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
  pathnameOverride?: string;
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
  staff: Users,
  students: Users,
  review: ClipboardCheck,
  qa: MessageSquareText,
  contact: Mail,
  notifications: BellRing,
  learning: NotebookPen,
  waitlist: ClipboardList,
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
              "group relative flex min-h-11 items-center rounded-sm border text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70",
              collapsed ? "justify-center px-0" : "gap-3 px-3.5 py-2.5",
              isActive
                ? "border-blue-200 bg-blue-50 text-[var(--color-brand-blue)] shadow-sm visited:text-[var(--color-brand-blue)] [&_span]:text-[var(--color-brand-blue)] [&_svg]:text-[var(--color-brand-blue)]"
                : "border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100",
            )}
          >
            {!collapsed ? (
              <span
                className={cn(
                  "absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full transition-colors",
                  isActive
                    ? "bg-[var(--color-brand-blue)]"
                    : "bg-transparent group-hover:bg-zinc-300",
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
                "flex shrink-0 items-center justify-center rounded-[4px] border text-[10px] font-semibold transition-colors",
                collapsed ? "size-10" : "size-8",
                item.state === "completed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : isActive
                    ? "border-blue-300 bg-blue-50 text-blue-950"
                  : item.state === "current"
                    ? "border-[var(--ppc-shell-accent)] bg-[var(--ppc-shell-accent)] text-white"
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
                  "group relative flex min-h-11 items-center rounded-[4px] border border-zinc-100 bg-zinc-50 text-zinc-400",
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
                "group relative flex min-h-11 items-center rounded-[4px] border transition-[background-color,border-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70",
                collapsed ? "justify-center px-0" : "gap-3 px-2.5 py-2",
                isActive
                  ? "border-blue-200 bg-blue-50 text-[var(--color-brand-blue)] shadow-sm"
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
                      isActive ? "text-zinc-950" : "text-zinc-900",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "block truncate text-[11px]",
                      isActive ? "text-zinc-600" : "text-zinc-500",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              ) : (
                <span className="sr-only">{item.label}</span>
              )}
              {!collapsed && item.state === "completed" ? (
                <span
                  className="ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded-[4px] border border-emerald-200 bg-emerald-50 text-emerald-700"
                  title={`${item.label} completed`}
                >
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">{item.label} completed</span>
                </span>
              ) : null}
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
            className="flex size-10 items-center justify-center rounded-sm border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700"
          >
            {getInitials(session.user.name)}
          </div>
          <Link
            href="/"
            title="Visit site"
            className="inline-flex size-10 items-center justify-center rounded-sm border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <Globe className="size-4" />
            <span className="sr-only">Visit site</span>
          </Link>
          <button
            type="button"
            title="Sign out"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = signOutHref;
            }}
            className="inline-flex size-10 items-center justify-center rounded-sm border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <LogOut className="size-4" />
            <span className="sr-only">Sign out</span>
          </button>
        </div>
      ) : (
        <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-sm border border-zinc-200 bg-white text-xs font-semibold text-zinc-700">
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
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[4px] border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              <Globe className="size-3.5" />
              Visit site
            </Link>
            <button
              type="button"
              onClick={async () => {
                await authClient.signOut();
                window.location.href = signOutHref;
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[4px] border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
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
              "group flex min-w-0 rounded-sm transition-colors hover:bg-zinc-50",
              collapsed ? "hidden" : "items-center p-1.5",
            )}
            title={collapsed ? "Pleros Perfecting Course" : undefined}
          >
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Pleros Perfecting Course
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
                "hidden shrink-0 rounded-sm border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 lg:inline-flex",
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
  pathnameOverride,
}: PpcShellProps) {
  const currentPathname = usePathname();
  const pathname = pathnameOverride ?? currentPathname;
  const logicalPathname = getLogicalPpcShellPath(pathname);
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
    <div className="ppc-theme min-h-screen bg-zinc-100/80 text-zinc-900">
      <div
        className={cn(
          "mx-auto min-h-screen w-full max-w-[1520px] grid-cols-1 gap-3 px-3 pb-3 lg:grid lg:gap-4 lg:p-4",
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
            <div className="flex h-full flex-col rounded-none border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,40,0.04),0_12px_28px_rgba(15,23,40,0.06)]">
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
          <header className="sticky top-0 z-20 -mx-3 flex min-h-14 items-center justify-between border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] px-4 py-2 text-white shadow-sm sm:-mx-4 sm:px-6 lg:top-0">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-sm border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/15 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="size-4" />
              </button>
              <div className="min-w-0">
                <p className="ppc-heading truncate text-base font-semibold tracking-[-0.025em] text-white sm:text-lg">
                  Pleros Perfecting Course
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-[11px] text-white/75 lg:flex">
              <GraduationCap className="size-3.5 text-white/60" />
              <span className="capitalize">{session.user.role}</span>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-1 pb-4 sm:px-2">{children}</main>
        </div>
      </div>

      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent
          side="left"
          className="ppc-theme w-[88vw] max-w-[320px] rounded-none p-0"
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
