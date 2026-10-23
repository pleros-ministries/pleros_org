"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, Trash2Icon, UserPlusIcon } from "lucide-react";

import { ActionMenu } from "@/components/community/action-menu";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";

import { GroupCard, leadColourways } from "./community-home-v3";
import styles from "./community-home-v3.module.css";

/**
 * Mockup (sample data, nothing saved): Community Home after the Pastor's 22
 * October review. Needs you becomes the third count card, in place of
 * Invitations, instead of a list filling the page; it opens Oversight's
 * Updates. Groups you lead get a ··· menu. A group opened from here steps
 * back to Community, with no Groups step in between.
 */

const LED = [
  { id: 1, name: "FCC Ife Leaders", meta: "6 people" },
  { id: 2, name: "FCC Ibadan Leaders", meta: "2 people" },
  { id: 3, name: "Daniel’s discipleship group", meta: "Invite someone" },
];

function Count({ href, count, label, icon, tone, description }: { href: string; count: number; label: string; icon: "chat" | "clipboardcheck" | "people"; tone: "blue" | "amber" | "green"; description: string }) {
  const body = <>
    <span className={styles.countHead}><DashboardIcon name={icon} size={16} strokeWidth={1.9} /><span>{label}</span></span>
    <b>{count}</b>
  </>;
  return count > 0 ? <Link href={href} className={styles.count} data-tone={tone} data-active aria-label={`${count} ${description}`}>{body}</Link>
    : <div className={styles.count} data-tone={tone} aria-label={`${count} ${description}`}>{body}</div>;
}

export function CommunityHomeMockup({ screen }: { screen: "home" | "group" }) {
  const [groups, setGroups] = useState(LED);
  if (screen === "group") return <div className="grid gap-3 px-4 pt-3">
    {/* The breadcrumb bar on a group opened from Community Home: no Groups step. */}
    <div className="flex h-11 items-center gap-2 border-b border-[var(--color-line,#e7e9ec)] text-[13px]">
      <Link href="?screen=home" className="grid size-9 place-items-center" aria-label="Back to Community"><ChevronLeftIcon className="size-4" strokeWidth={2.2} /></Link>
      <span className="text-(--color-text-muted)">Community</span>
      <ChevronRightIcon className="size-3.5 text-(--color-text-muted)" aria-hidden="true" />
      <span className="font-medium">FCC Ife Leaders</span>
    </div>
    <p className="m-0 text-[13px] leading-5 text-(--color-text-muted)">Back now returns to Community Home, where you came from. The group page itself is unchanged.</p>
  </div>;

  return <div className={styles.home}>
    <header className={styles.heading}><h1>Your Pleros Community</h1></header>

    {/* Needs you takes the third count's place: a count to tap, not a list. */}
    <div className={styles.counts} aria-label="Waiting for you">
      <Count href="#" count={2} label="Messages" icon="chat" tone="blue" description="unread messages" />
      <Count href="#" count={1} label="Check-ins" icon="clipboardcheck" tone="amber" description="check-ins to answer" />
      <Count href="#" count={5} label="Needs you" icon="people" tone="amber" description="people who need you" />
    </div>

    <section className={styles.block}>
      <div className={styles.blockHeading}><h2>Groups you lead</h2></div>
      <div className={styles.groupGrid}>
        {groups.map((group, index) => <div key={group.id} className="relative">
          <GroupCard href="?screen=group" art="leading" colourway={leadColourways[index % leadColourways.length]} title={group.name} meta={group.meta} />
          {/* The menu sits beside the card's link, never inside it. */}
          <span className="absolute top-2.5 right-2.5 z-[2]">
            <ActionMenu label={`${group.name} options`} className="!size-8 !rounded-[10px] bg-white/80" actions={[
              { key: "rename", label: "Rename group", icon: PencilIcon, onSelect: () => window.alert("Preview: Rename opens here.") },
              { key: "invite", label: "Invite people", icon: UserPlusIcon, onSelect: () => window.alert("Preview: Invite opens the group's invite panel.") },
              { key: "close", label: "Delete group", icon: Trash2Icon, danger: true, onSelect: () => { if (window.confirm(`Delete ${group.name}? Its invite link stops working. This can’t be undone.`)) setGroups(list => list.filter(item => item.id !== group.id)); } },
            ]} />
          </span>
        </div>)}
        <Link href="#" className={styles.newGroup}><span className={styles.newGroupIcon}><DashboardIcon name="plus" size={16} /></span>New group</Link>
      </div>
    </section>
  </div>;
}

