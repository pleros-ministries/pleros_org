"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellIcon, BellOffIcon, CheckCheckIcon, ClipboardCheckIcon, HandHeartIcon, MegaphoneIcon, MessageCircleIcon,
  MessageCircleQuestionIcon, SettingsIcon, ShieldCheckIcon, UsersRoundIcon, XIcon,
} from "lucide-react";

import { communityKeys } from "@/lib/community/query-keys";
import { markCommunityNotificationsRead } from "@/app/(site)/dashboard/community/_actions/leader-actions";
import dashboardStyles from "@/components/dashboard/v3/dashboard.module.css";

import styles from "./notification-center.module.css";

type Notification = {
  id: number;
  kind: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

async function fetchNotifications(): Promise<{ notifications: Notification[]; unread: number }> {
  const res = await fetch("/api/community/notifications", { credentials: "same-origin" });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

async function fetchNotificationSummary(): Promise<number> {
  const res = await fetch("/api/community/notifications?summary=1", { credentials: "same-origin" });
  if (!res.ok) throw new Error("Failed to load notification count");
  const data = (await res.json()) as { unread: number };
  return data.unread;
}

/** Matches the panel exit in notification-center.module.css. */
const PANEL_EXIT_MS = 180;
const text = (value: unknown) => (typeof value === "string" && value.trim() ? value : null);
const id = (value: unknown) => (typeof value === "number" && Number.isInteger(value) && value > 0 ? value : typeof value === "string" && /^\d{1,9}$/.test(value) ? Number(value) : null);

function summarise(n: Notification): string {
  const p = n.payload;
  switch (n.kind) {
    case "official_post": return `New update: ${text(p.title) ?? "open the community"}`;
    case "post_comment": return `New comment on “${text(p.title) ?? "your post"}”`;
    case "comment_reply": return `Someone replied to your comment${text(p.title) ? ` on “${text(p.title)}”` : ""}`;
    case "made_leader": return `You now lead ${text(p.unitName) ?? "your unit"}${p.church && text(p.branchName) ? ` · ${text(p.branchName)} branch` : ""}`;
    case "flag_resolved": return `Your report was ${text(p.outcome) ?? "reviewed"}`;
    case "daily_report_reminder": return "Please complete your daily report";
    case "leader_nudge": return text(p.message) ?? "A note from your unit leader";
    case "discipleship_joined": return `${text(p.name) ?? "Someone"} joined your group`;
    case "discipleship_prompt": return `New check-in from ${text(p.name) ?? "your discipler"}`;
    case "discipleship_response": return `${text(p.name) ?? "Someone"} answered your check-in`;
    case "discipleship_reply": return `${text(p.name) ?? "Your discipler"} replied to your check-in`;
    case "discipleship_nudge": return `${text(p.name) ?? "Your discipler"}: ${text(p.message) ?? "thinking of you"}`;
    case "discipleship_alert": return text(p.message) ?? "Discipleship update";
    case "discipleship_digest": return text(p.message) ?? "Your discipleship week";
    case "discipleship_prayer_request": return `${text(p.name) ?? "Someone"} shared a prayer request`;
    case "discipleship_prayed": return `${text(p.name) ?? "Your discipler"} prayed for your request`;
    case "discipleship_prayer_answered": return `${text(p.name) ?? "Someone"} shared an answered prayer`;
    case "discipleship_post": return `${text(p.name) ?? "Someone"} posted in your group`;
    case "group_join_request": return `${text(p.name) ?? "Someone"} asked to join ${text(p.groupName) ?? "your group"}`;
    case "group_join_approved": return `You are now a member of ${text(p.groupName) ?? "the group"}`;
    case "pleros_reply": return "Pleros replied to your question";
    case "enrollee_handed_over": return `${text(p.fromName) ?? "Someone"} handed ${text(p.enrolleeName) ?? "someone"} over to you`;
    case "group_invitation": return `${text(p.name) ?? "A leader"} invited you to join ${text(p.groupName) ?? "their group"}`;
    case "unit_workers_added": {
      const names = Array.isArray(p.names) ? p.names.filter((name): name is string => typeof name === "string") : [];
      const count = typeof p.count === "number" ? p.count : names.length;
      const who = count === 1 && names[0] ? names[0] : count <= 3 && names.length === count ? names.join(", ").replace(/, ([^,]*)$/, " and $1") : `${count} people`;
      return `${who} joined ${text(p.unitName) ?? "your unit"} as ${count === 1 ? "a worker" : "workers"}`;
    }
    case "follow_up_changed": return `${text(p.ownerName) ?? "Someone new"} will look after you now`;
    default: return "Community update";
  }
}

/** Where tapping a notification goes, from the ids its payload already carries. */
function destination(n: Notification): string | null {
  const p = n.payload;
  const post = id(p.postId);
  if (post && ["official_post", "post_comment", "comment_reply", "discipleship_post"].includes(n.kind)) return `/dashboard/community/post/${post}`;
  if (n.kind === "daily_report_reminder") return `/dashboard/community/report${typeof p.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.day) ? `?day=${p.day}` : ""}`;
  if (n.kind === "enrollee_handed_over") return id(p.enrollmentId) ? `/dashboard/community/enrollees/${id(p.enrollmentId)}` : "/dashboard/community/enrollees";
  if (n.kind === "follow_up_changed") return "/dashboard/sogp/follow-up/welcome";
  if (n.kind === "pleros_reply") return id(p.questionId) ? `/dashboard/community/ask/${id(p.questionId)}` : "/dashboard/community/ask";
  if (n.kind.startsWith("group_join")) return id(p.groupId) ? `/dashboard/community/groups/${id(p.groupId)}` : "/dashboard/community/groups";
  if (n.kind.startsWith("discipleship_")) return "/dashboard/community/discipleship";
  if ((n.kind === "made_leader" && p.church) || n.kind === "unit_workers_added") return "/dashboard/church";
  if (n.kind === "group_invitation") return id(p.invitationId) ? `/dashboard/sogp/invitations/${id(p.invitationId)}` : "/dashboard/community";
  if (n.kind === "made_leader" || n.kind === "leader_nudge") return "/dashboard/community/leader";
  return null;
}

/** One tinted icon per kind of notification, so the list scans by type. */
function icon(kind: string): { node: ReactNode; tone: [string, string] } {
  const size = "size-4";
  if (kind === "daily_report_reminder") return { node: <ClipboardCheckIcon className={size} strokeWidth={2} />, tone: ["#f7e4cd", "#92400e"] };
  if (kind === "official_post") return { node: <MegaphoneIcon className={size} strokeWidth={2} />, tone: ["#e4ebfd", "#2331ae"] };
  if (kind === "post_comment" || kind === "comment_reply") return { node: <MessageCircleIcon className={size} strokeWidth={2} />, tone: ["#e4ebfd", "#2331ae"] };
  if (kind.includes("prayer") || kind === "discipleship_prayed") return { node: <HandHeartIcon className={size} strokeWidth={2} />, tone: ["#fde3cf", "#7a3a10"] };
  if (kind.startsWith("discipleship_") || kind.startsWith("group_join")) return { node: <UsersRoundIcon className={size} strokeWidth={2} />, tone: ["#efe7fb", "#56209c"] };
  if (kind === "enrollee_handed_over" || kind === "follow_up_changed" || kind === "unit_workers_added" || kind === "group_invitation") return { node: <UsersRoundIcon className={size} strokeWidth={2} />, tone: ["#e4ebfd", "#2331ae"] };
  if (kind === "pleros_reply") return { node: <MessageCircleQuestionIcon className={size} strokeWidth={2} />, tone: ["#cfe6fb", "#0e3f73"] };
  if (kind === "made_leader" || kind === "leader_nudge" || kind === "flag_resolved") return { node: <ShieldCheckIcon className={size} strokeWidth={2} />, tone: ["#e6ecfc", "#1f3260"] };
  return { node: <BellIcon className={size} strokeWidth={2} />, tone: ["#eceef2", "#4b5260"] };
}

const lagosDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit", hour12: true });
const dateFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short" });

function when(iso: string, now: Date): { group: "Today" | "Yesterday" | "Earlier"; label: string } {
  const date = new Date(iso);
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  const today = lagosDay.format(now);
  const yesterday = lagosDay.format(new Date(now.getTime() - 86_400_000));
  const day = lagosDay.format(date);
  const group = day === today ? "Today" : day === yesterday ? "Yesterday" : "Earlier";
  const label = minutes < 1 ? "Just now" : minutes < 60 ? `${minutes} min ago` : group === "Today" ? timeFormat.format(date).replace(/\s/g, " ") : group === "Yesterday" ? `Yesterday, ${timeFormat.format(date)}` : dateFormat.format(date);
  return { group, label };
}

/**
 * The dashboard notification centre (Pastor review, 18 October). Patterns from
 * Mobbin and notification-centre guidance (Courier, Visa, PatternFly): one
 * unread dot plus a medium title, Today / Yesterday / Earlier groups, All and
 * Unread, one-tap "Mark all read", a link to settings, a full-screen sheet on
 * phones and an anchored panel from `lg`. Items stay marked as new while the
 * panel is open and are marked read when it closes.
 */
export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  // Keeps the panel mounted while it leaves (PANEL_EXIT_MS matches the CSS).
  const [leaving, setLeaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [clearedAt, setClearedAt] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();

  const summary = useQuery({
    queryKey: communityKeys.notificationSummary(),
    queryFn: fetchNotificationSummary,
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
  const { data, error, refetch } = useQuery({
    queryKey: communityKeys.notifications(),
    queryFn: fetchNotifications,
    enabled: open,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const unread = summary.data ?? data?.unread ?? 0;

  const markRead = useMutation({
    mutationFn: () => markCommunityNotificationsRead(),
    onMutate: () => { queryClient.setQueryData<number>(communityKeys.notificationSummary(), 0); },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: communityKeys.notificationSummary() });
      void queryClient.invalidateQueries({ queryKey: communityKeys.notifications() });
    },
  });

  function close() {
    setOpen(false);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLeaving(true);
      window.setTimeout(() => setLeaving(false), PANEL_EXIT_MS);
    }
    if ((data?.notifications ?? []).some(item => !item.readAt) && clearedAt === null) markRead.mutate();
    setClearedAt(null);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    // Phones: the sheet covers the page, so the page behind it should not scroll.
    const phone = window.matchMedia("(max-width: 63.99rem)").matches;
    const previous = document.body.style.overflow;
    if (phone) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      document.body.style.overflow = previous;
    };
    // close reads the latest data; re-binding on every data change is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data]);

  const now = new Date();
  const items = (data?.notifications ?? []).map(item => ({ ...item, isNew: !item.readAt && clearedAt === null }));
  const newCount = items.filter(item => item.isNew).length;
  const visible = filter === "unread" ? items.filter(item => item.isNew) : items;
  const groups = (["Today", "Yesterday", "Earlier"] as const)
    .map(name => ({ name, rows: visible.filter(item => when(item.createdAt, now).group === name) }))
    .filter(group => group.rows.length);

  return <div className={styles.anchor} ref={root}>
    <button type="button" ref={trigger} onClick={() => { if (open) { close(); return; } setFilter("all"); setOpen(true); }}
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} aria-controls={panelId} aria-haspopup="dialog"
      className={dashboardStyles.iconButton}>
      <span className={styles.bell}>
        <BellIcon className="size-[21px]" strokeWidth={1.9} aria-hidden="true" />
        {unread > 0 ? <span className={styles.dot} aria-hidden="true">{unread > 9 ? "9+" : unread}</span> : null}
      </span>
    </button>

    {open || leaving ? <div id={panelId} role="dialog" aria-labelledby={titleId} className={styles.panel} data-closing={!open || undefined} inert={!open}>
      <header className={styles.head}>
        <h2 id={titleId} data-dashboard-shell-title>Notifications</h2>
        <div className={styles.headActions}>
          {newCount ? <button type="button" className={styles.textButton} disabled={markRead.isPending} onClick={() => { setClearedAt(Date.now()); markRead.mutate(); }}>
            <CheckCheckIcon className="size-4" strokeWidth={2} aria-hidden="true" />Mark all read
          </button> : null}
          <button type="button" className={styles.close} onClick={close} aria-label="Close notifications"><XIcon className="size-5" strokeWidth={2} /></button>
        </div>
      </header>

      <div className={styles.switch} role="tablist" aria-label="Show">
        {(["all", "unread"] as const).map(key => <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}>
          {key === "all" ? "All" : "Unread"}{key === "unread" && newCount ? <span className={styles.count}>{newCount}</span> : null}
        </button>)}
      </div>

      <div className={styles.body}>
        {error ? <div role="alert" className={styles.empty}><p>Notifications couldn’t be loaded.</p><button type="button" className={styles.textButton} onClick={() => void refetch()}>Try again</button></div>
          : !data ? <ul className={styles.list} aria-busy="true" aria-label="Loading notifications">{[0, 1, 2, 3].map(i => <li key={i} className={styles.skeleton}><i /><span><b /><b /></span></li>)}</ul>
          : !groups.length ? <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true"><BellOffIcon className="size-5" strokeWidth={1.9} /></span>
            <p className={styles.emptyTitle}>{filter === "unread" ? "You’re all caught up" : "No notifications yet"}</p>
            <p>{filter === "unread" ? "New replies, check-ins and reminders will show here." : "Replies, group activity, check-ins and report reminders will show here."}</p>
          </div>
          : groups.map(group => <section key={group.name} aria-label={group.name}>
            <h3 className={styles.group}>{group.name}</h3>
            <ul className={styles.list}>{group.rows.map(item => {
              const look = icon(item.kind);
              const href = destination(item);
              const body = <>
                <span className={styles.icon} style={{ background: look.tone[0], color: look.tone[1] }} aria-hidden="true">{look.node}</span>
                <span className={styles.copy}>
                  <span className={styles.title} data-new={item.isNew || undefined}>{summarise(item)}</span>
                  <span className={styles.time}>{when(item.createdAt, now).label}</span>
                </span>
                {item.isNew ? <span className={styles.newDot}><span className="sr-only">New</span></span> : null}
              </>;
              return <li key={item.id}>{href
                ? <Link href={href} className={styles.row} onClick={close}>{body}</Link>
                : <div className={styles.row}>{body}</div>}</li>;
            })}</ul>
          </section>)}
      </div>

      <footer className={styles.foot}>
        <Link href="/dashboard/profile/reminders" className={styles.textButton} onClick={close}><SettingsIcon className="size-4" strokeWidth={2} aria-hidden="true" />Notification settings</Link>
      </footer>
    </div> : null}
  </div>;
}
