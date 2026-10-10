"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDownIcon,
  GiftIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  LayoutGridIcon,
  MessageCircleIcon,
  SunriseIcon,
  type LucideIcon,
} from "lucide-react";

import { useUnreadQuestions } from "@/components/community/ask/use-unread-questions";
import { useUnreadMessages } from "@/components/community/messages/use-unread-messages";
import {
  findActiveNavItem,
  type DashboardNavBadge,
  type DashboardNavSection,
  type DashboardNavSectionKey,
} from "@/lib/dashboard/navigation";
import { cn } from "@/lib/utils";

import motion from "./dashboard-shell.module.css";
import { focusRing } from "./styles";

const sectionIcons: Record<DashboardNavSectionKey, LucideIcon> = {
  personal: LayoutGridIcon,
  devotion: SunriseIcon,
  training: GraduationCapIcon,
  community: MessageCircleIcon,
  oversight: HeartHandshakeIcon,
  welcome: GiftIcon,
};

function MessagesBadge() {
  const unread = useUnreadMessages();
  if (unread <= 0) return null;
  return (
    <span
      aria-label={`${unread} unread`}
      className="grid h-5 min-w-5 place-items-center rounded-full bg-(--color-brand-blue) px-1.5 text-[11px] font-medium tabular-nums text-white"
    >
      {unread > 99 ? "99+" : unread}
    </span>
  );
}

function QuestionsBadge() {
  const unread = useUnreadQuestions();
  if (unread <= 0) return null;
  return (
    <span
      aria-label="Pleros has replied"
      className="size-2 rounded-full bg-(--color-brand-blue)"
    />
  );
}

function NavBadge({ kind }: { kind: DashboardNavBadge }) {
  return kind === "messages" ? <MessagesBadge /> : <QuestionsBadge />;
}

/** A dot on the closed Community parent while a message or reply waits. */
function CommunityPending() {
  const messages = useUnreadMessages();
  const questions = useUnreadQuestions();
  if (messages + questions <= 0) return null;
  return (
    <span aria-hidden className="size-1.5 rounded-full bg-(--color-brand-blue)" />
  );
}

/**
 * Six parents with their pages as indented, text-only children. One parent
 * is open at a time; it follows the current page until the viewer picks
 * another. Closed children are inert so they leave the tab order.
 */
export function DashboardNav({
  sections,
  onNavigate,
  label = "Dashboard",
}: {
  sections: DashboardNavSection[];
  onNavigate?: () => void;
  label?: string;
}) {
  const pathname = usePathname() ?? "";
  const panelId = useId();
  const active = findActiveNavItem(sections, pathname);
  const [picked, setPicked] = useState<{
    pathname: string;
    key: DashboardNavSectionKey | null;
  } | null>(null);
  const openKey =
    picked?.pathname === pathname ? picked.key : (active?.sectionKey ?? "personal");

  return (
    <nav aria-label={label} className="grid content-start gap-1">
      {sections.map((section) => {
        const open = openKey === section.key;
        const Icon = sectionIcons[section.key];
        const id = `${panelId}-${section.key}`;
        const hasBadges = section.items.some((item) => item.badge);
        return (
          <div key={section.key}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={id}
              onClick={() => setPicked({ pathname, key: open ? null : section.key })}
              className={cn(
                "flex min-h-10 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13.5px] font-medium text-(--color-text-strong) transition-colors hover:bg-(--color-surface-muted)",
                open && "bg-(--color-surface-muted)",
                focusRing,
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-(--color-brand-sky) text-(--color-brand-blue)">
                <Icon className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="flex-1">{section.label}</span>
              {hasBadges && !open ? <CommunityPending /> : null}
              <ChevronDownIcon
                className={cn(
                  motion.navChevron,
                  "size-3.5 text-(--color-text-muted)",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            <div
              id={id}
              className={motion.navPanel}
              data-open={open}
              aria-hidden={!open}
              inert={!open}
            >
              <div className="min-h-0 overflow-hidden">
                <ul className="grid gap-0.5 pb-1 pt-0.5">
                  {section.items.map((item) => {
                    const current = active?.itemKey === item.key;
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={current ? "page" : undefined}
                          className={cn(
                            "flex min-h-9 items-center gap-2 rounded-md pl-[2.875rem] pr-2.5 text-[13px] transition-colors",
                            focusRing,
                            current
                              ? "bg-(--color-brand-sky-soft) font-medium text-(--color-brand-blue)"
                              : "text-(--color-text) hover:bg-(--color-surface-muted)",
                          )}
                        >
                          <span className="flex-1">{item.label}</span>
                          {item.badge ? <NavBadge kind={item.badge} /> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
