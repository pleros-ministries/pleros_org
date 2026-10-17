"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircleIcon, NotebookPenIcon, PhoneIcon, PlusIcon, SearchIcon, Share2Icon, UserPlusIcon } from "lucide-react";

import { logFollowUpAction } from "@/app/(site)/dashboard/community/_actions/people-actions";

import type { MinistryContact } from "@/lib/community/reporting-v3";
import type { OwnEnrolleeRow } from "@/lib/db/queries/sogp-follow-up-routes";

import styles from "../discipleship/discipleship-group.module.css";
import { Initials } from "../discipleship/shared";
import { ActionMenu, type MenuAction } from "../action-menu";
import { GroupTabs } from "../groups/group-hero";

export const CONTACTS_PATH = "/dashboard/community/contacts";
const contactId = (key: string) => key.split(":")[1];
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });

function SearchBox({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className={styles.search}>
    <SearchIcon className="size-4 shrink-0" strokeWidth={2} />
    <span className="sr-only">{label}</span>
    <input type="search" placeholder={label} value={value} onChange={event => onChange(event.target.value)} />
  </label>;
}

/**
 * Saved contacts, under Groups: people met in ministry, private to the
 * member, each one tap from a group invite. Contacts never become members.
 */
export function SavedContactsList({ contacts, readOnly, invites = {} }: {
  contacts: MinistryContact[];
  readOnly: boolean;
  /** Latest group invite per contact id. */
  invites?: Record<number, { groupName: string; at: string }>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "not" | "invited">("all");
  const needle = query.trim().toLowerCase();
  const inviteOf = (row: MinistryContact) => invites[Number(contactId(row.key))] ?? null;
  const notInvited = contacts.filter(row => !inviteOf(row)).length;
  const rows = contacts
    .filter(row => !needle || `${row.name} ${row.phone ?? ""} ${row.email ?? ""}`.toLowerCase().includes(needle))
    .filter(row => filter === "all" || (filter === "invited") === Boolean(inviteOf(row)));
  return <div className={styles.page}>
    <div className={styles.heading}>
      <div><h1>Saved contacts</h1><p className={styles.sub}>{contacts.length} {contacts.length === 1 ? "person" : "people"} · private to you</p></div>
      {readOnly ? null : <Link href={`${CONTACTS_PATH}/new`} className={styles.btn} data-primary><PlusIcon className="size-3.5" strokeWidth={2.2} />Add</Link>}
    </div>
    {contacts.length ? <>
      <SearchBox label="Search contacts" value={query} onChange={setQuery} />
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Filter contacts">
        {([["all", `All · ${contacts.length}`], ["not", `Not invited · ${notInvited}`], ["invited", `Invited · ${contacts.length - notInvited}`]] as const).map(([key, label]) =>
          <button key={key} type="button" role="radio" aria-checked={filter === key} onClick={() => setFilter(key)} className={`${styles.btn} ${styles.mini}`} data-primary={filter === key ? "" : undefined}>{label}</button>)}
      </div>
    </> : null}
    {rows.length ? <div className={styles.panel}>
      <ul className={styles.list}>
        {rows.map(row => <li key={row.key} className={styles.row}>
          <Link href={`${CONTACTS_PATH}/${contactId(row.key)}`} className={styles.personLink}>
            <Initials name={row.name} />
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{row.name}</span><span className={styles.rowMeta}>{inviteOf(row) ? `Invited to ${inviteOf(row)!.groupName} · ${day.format(new Date(inviteOf(row)!.at))}` : row.phone ?? "Phone not recorded"}</span></span>
          </Link>
          {inviteOf(row) ? <span className={styles.pill}>Invited</span>
            : !readOnly && row.phone ? <Link href={`${CONTACTS_PATH}/${contactId(row.key)}/invite`} className={`${styles.btn} ${styles.mini}`}>Invite</Link> : null}
        </li>)}
      </ul>
    </div> : <p className={`${styles.panel} ${styles.empty}`}>{query || filter !== "all" ? "No contacts match." : "No saved contacts yet. Add the people you meet in ministry."}</p>}
    <p className={styles.note}>🔒 Contacts never become group members on their own. They join only after enrolling and accepting your invite.</p>
  </div>;
}

type EnrolleeTab = "free" | "all";

const SOURCE: Record<OwnEnrolleeRow["source"], string> = {
  code: "Your referral code",
  link: "Your referral link",
  geography: "Your area",
  reassigned: "Reassigned to you",
  assigned: "Assigned to you",
};
const WEEK_MS = 7 * 86_400_000;

/**
 * My enrollees, under Groups: people who signed up with the member's link or
 * code (or were assigned to them), with the ones not yet in a group first,
 * newest first, split into this week and earlier.
 */
export function EnrolleesList({ rows, referralUrl, contacts = {} }: {
  rows: OwnEnrolleeRow[];
  referralUrl: string | null;
  /** WhatsApp and call links per enrolment, for their follow-up owner only. */
  contacts?: Record<number, { whatsappUrl: string | null; callHref: string | null }>;
}) {
  const router = useRouter();
  const free = rows.filter(row => !row.group);
  const [tab, setTab] = useState<EnrolleeTab>(free.length ? "free" : "all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [now] = useState(() => Date.now());
  const needle = query.trim().toLowerCase();
  const visible = (tab === "free" ? free : rows).filter(row => !needle || row.name.toLowerCase().includes(needle));
  const recent = visible.filter(row => now - new Date(row.assignedAt).getTime() < WEEK_MS);
  const earlier = visible.filter(row => now - new Date(row.assignedAt).getTime() >= WEEK_MS);
  async function share() {
    if (!referralUrl) return;
    try {
      if (navigator.share) await navigator.share({ title: "Join SOGP", url: referralUrl });
      else { await navigator.clipboard.writeText(referralUrl); setCopied(true); }
    } catch { /* The share sheet was dismissed. */ }
  }
  const followUp = (row: OwnEnrolleeRow): MenuAction[] => {
    const links = contacts[row.enrollmentId];
    const page = `/dashboard/community/enrollees/${row.enrollmentId}`;
    return [
      ...(links?.whatsappUrl ? [{ key: "whatsapp", label: "WhatsApp", icon: MessageCircleIcon, onSelect: () => { void logFollowUpAction({ enrollmentId: row.enrollmentId, kind: "whatsapp" }); window.open(links.whatsappUrl!, "_blank", "noopener"); } }] : []),
      ...(links?.callHref ? [{ key: "call", label: "Call", icon: PhoneIcon, onSelect: () => { void logFollowUpAction({ enrollmentId: row.enrollmentId, kind: "call" }); window.location.href = links.callHref!; } }] : []),
      { key: "log", label: "Log a follow-up", icon: NotebookPenIcon, onSelect: () => router.push(`${page}#follow-ups`) },
      ...(!row.group && !row.invited ? [{ key: "invite", label: "Invite to a group", icon: UserPlusIcon, onSelect: () => router.push(`/dashboard/community/enrollees/${row.enrollmentId}/invite`) }] : []),
    ];
  };
  const end = (row: OwnEnrolleeRow) => row.group
    ? <span className={styles.pill} data-tone="ok" title={row.group.name ?? undefined}>{row.group.yours ? "In your group" : "In a group"}</span>
    : row.invited
      ? <span className={styles.pill}>Invited</span>
      : null;
  const list = (title: string, items: OwnEnrolleeRow[]) => items.length ? <>
    <div className={styles.sectionTitle}><h2>{title}</h2><span className={styles.rowMeta}>{items.length}</span></div>
    <div className={styles.panel}>
      <ul className={styles.list}>
        {items.map(row => <li key={row.enrollmentId} className={styles.row}>
          <Link href={`/dashboard/community/enrollees/${row.enrollmentId}`} className={styles.personLink}>
          <Initials name={row.name} />
          <span className={styles.rowCopy}>
            <span className={styles.rowTitle}>{row.name}</span>
            <span className={styles.rowMeta}>{SOURCE[row.source]} · {day.format(new Date(row.assignedAt))}</span>
            {row.lastContactedAt
              ? <span className={styles.rowMeta}>Last contact {day.format(new Date(row.lastContactedAt))}</span>
              : <span className={styles.rowMeta} style={{ color: "#92400e" }}>Not contacted yet</span>}
          </span>
          </Link>
          {end(row)}
          <ActionMenu label={`Follow up with ${row.name}`} actions={followUp(row)} trigger="Follow up" />
        </li>)}
      </ul>
    </div>
  </> : null;

  return <div className={styles.page}>
    <div className={styles.heading}>
      <div><h1>My enrollees</h1><p className={styles.sub}>{rows.length} {rows.length === 1 ? "person" : "people"} you follow up</p></div>
      {referralUrl ? <button type="button" className={styles.btn} onClick={share}><Share2Icon className="size-3.5" strokeWidth={2} />{copied ? "Link copied" : "Share link"}</button> : null}
    </div>
    {rows.length ? <>
      <GroupTabs tabs={[{ key: "free", label: "Not in a group", count: free.length }, { key: "all", label: "All", count: rows.length }]} value={tab} onChange={setTab} />
      <SearchBox label="Search enrollees" value={query} onChange={setQuery} />
    </> : null}
    {visible.length ? <>{list("This week", recent)}{list("Earlier", earlier)}</>
      : <p className={`${styles.panel} ${styles.empty}`}>{needle ? "No one matches your search." : rows.length ? "Everyone you follow up is in a group." : "When someone joins with your code or link, they’ll appear here."}</p>}
    <p className={styles.note}>Invite picks one of your discipleship groups. They join after accepting in Pleros.</p>
  </div>;
}
