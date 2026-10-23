"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PencilIcon, Trash2Icon, UserPlusIcon } from "lucide-react";

import { closeDiscipleshipGroupAction } from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import type { CommunityHomeData } from "@/lib/db/queries/community-home";

import { ActionMenu } from "./action-menu";
import { GroupCard, leadColourways } from "./community-home-cards";
import styles from "./community-home-v3.module.css";
import discipleStyles from "./discipleship/discipleship-group.module.css";
import { Initials } from "./discipleship/shared";

type IconName = Parameters<typeof DashboardIcon>[0]["name"];

function CountCard({ href, onClick, open, count, label, description, icon, tone, capped }: { href?: string | null; onClick?: () => void; open?: boolean; count: number; label: string; description: string; icon: IconName; tone: "blue" | "amber" | "green"; capped?: boolean }) {
  // One column of the divided strip: a quiet icon + label, the number beneath.
  const body = <>
    <span className={styles.countHead}><DashboardIcon name={icon} size={16} strokeWidth={1.9} /><span>{label}</span></span>
    <b>{count}{capped ? "+" : ""}</b>
  </>;
  const aria = `${count}${capped ? " or more" : ""} ${description}`;
  if (count > 0 && onClick) return <button type="button" className={`${styles.count} text-left`} data-tone={tone} data-active aria-expanded={open} aria-label={aria} onClick={onClick}>{body}</button>;
  return href && count > 0
    ? <Link href={href} prefetch={false} className={styles.count} data-tone={tone} data-active aria-label={aria}>{body}</Link>
    : <div className={styles.count} data-tone={tone} aria-label={aria}>{body}</div>;
}

/**
 * The counts at the top of Community Home (Pastor, 22 October): Messages,
 * Check-ins and Needs you. Needs you is a count that drops down to the
 * people who need you, never a list filling the page.
 */
export function CommunityCounts({ data, updatesHref }: { data: CommunityHomeData; updatesHref: string | null }) {
  const [open, setOpen] = useState(false);
  const firstResponse = data.responses[0];
  const shown = data.needsYou.slice(0, 5);
  return <>
    <div className={styles.counts} aria-label="Waiting for you">
      <CountCard href="/dashboard/community/messages" count={data.unreadConversations} label="Messages" description={data.unreadConversations === 1 ? "unread message" : "unread messages"} icon="chat" tone="blue" />
      <CountCard href={firstResponse ? (data.responses.length > 1 ? "/dashboard/community/discipleship" : firstResponse.href) : null} count={data.responses.length} capped={data.responses.length >= 3} label="Check-ins" description={data.responses.length === 1 ? "check-in to answer" : "check-ins to answer"} icon="clipboardcheck" tone="amber" />
      <CountCard onClick={() => setOpen(value => !value)} open={open} count={data.needsYou.length} label="Needs you" description={data.needsYou.length === 1 ? "person who needs you" : "people who need you"} icon="people" tone="amber" />
    </div>
    {open && shown.length ? <div className={`${discipleStyles.panel} mt-2.5`}>
      <ul className={discipleStyles.list}>
        {shown.map(item => <li key={item.key}>
          <Link href={item.href} prefetch={false} className={discipleStyles.row}>
            <Initials name={item.name} status={item.tone === "off" ? "unresponsive" : item.tone === "risk" ? "at_risk" : undefined} />
            <span className={discipleStyles.rowCopy}>
              <span className={discipleStyles.rowTitle}>{item.firstName}</span>
              <span className={discipleStyles.rowMeta}>{item.detail}{data.showGroupNames && item.groupName ? ` · ${item.groupName}` : ""}</span>
            </span>
            <span className={discipleStyles.btn} data-primary={item.tone === "off" ? "" : undefined}>{item.action}</span>
          </Link>
        </li>)}
      </ul>
      {data.needsYou.length > shown.length && updatesHref ? <Link href={updatesHref} className={`${discipleStyles.quiet} block px-4 pt-1 pb-3`}>See all in Updates</Link> : null}
    </div> : null}
  </>;
}

/**
 * A group you lead, with a ··· menu beside it (Pastor, 22 October): rename,
 * invite or delete without opening it. Deleting closes the group; it goes at
 * once and comes back with a message if it can't be closed.
 */
export function LedGroupCards({ groups, newGroupHref, extra }: { groups: CommunityHomeData["ledGroups"]; newGroupHref: string; extra?: React.ReactNode }) {
  const router = useRouter();
  const [gone, setGone] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const shown = groups.filter(group => !gone.has(group.groupId));
  const remove = (group: CommunityHomeData["ledGroups"][number]) => {
    const people = group.discipleCount ? ` Its ${group.discipleCount === 1 ? "1 person" : `${group.discipleCount} people`} will leave the group; the people they lead stay with them.` : "";
    if (!window.confirm(`Delete ${group.groupName}? Its invite link stops working.${people} This can’t be undone.`)) return;
    setError(null);
    setGone(current => new Set(current).add(group.groupId));
    void closeDiscipleshipGroupAction({ groupId: group.groupId })
      .catch(() => ({ ok: false as const, error: "Couldn’t delete that group. Check your connection and try again." }))
      .then(result => {
        if (result.ok) { router.refresh(); return; }
        setGone(current => { const next = new Set(current); next.delete(group.groupId); return next; });
        setError(`${group.groupName}: ${result.error}`);
      });
  };
  return <>
    <div className={styles.groupGrid}>
      {shown.map((group, index) => {
        const href = `/dashboard/community/discipleship/${group.groupId}`;
        return <div key={group.groupId} className="relative">
          <GroupCard href={href} prefetch={false} art="leading" colourway={leadColourways[index % leadColourways.length]} title={group.groupName} meta={group.discipleCount ? `${group.discipleCount} ${group.discipleCount === 1 ? "person" : "people"}` : "Invite someone"} />
          {/* The menu sits beside the card's link, never inside it. */}
          <span className="absolute top-2.5 right-2.5 z-[2]">
            <ActionMenu label={`${group.groupName} options`} className="!size-8 !rounded-[10px] bg-white/80" actions={[
              { key: "rename", label: "Rename group", icon: PencilIcon, onSelect: () => router.push(`${href}?panel=rename`) },
              { key: "invite", label: "Invite people", icon: UserPlusIcon, onSelect: () => router.push(`${href}?panel=invite`) },
              // The last group you lead can't be closed, so it offers no Delete.
              ...(shown.length > 1 ? [{ key: "delete", label: "Delete group", icon: Trash2Icon, danger: true, onSelect: () => remove(group) }] : []),
            ]} />
          </span>
        </div>;
      })}
      {extra}
      <Link href={newGroupHref} prefetch={false} className={styles.newGroup}>
        <span className={styles.newGroupIcon}><DashboardIcon name="plus" size={16} /></span>
        New group
      </Link>
    </div>
    {error ? <p role="alert" className={`${discipleStyles.error} mt-2`}>{error}</p> : null}
  </>;
}
