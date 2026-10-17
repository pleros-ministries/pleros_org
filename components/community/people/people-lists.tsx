"use client";

import Link from "next/link";
import { useState } from "react";
import { PlusIcon, SearchIcon, Share2Icon } from "lucide-react";

import type { MinistryContact } from "@/lib/community/reporting-v3";
import type { OwnEnrolleeRow } from "@/lib/db/queries/sogp-follow-up-routes";

import styles from "../discipleship/discipleship-group.module.css";
import { Initials } from "../discipleship/shared";
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
export function SavedContactsList({ contacts, readOnly }: { contacts: MinistryContact[]; readOnly: boolean }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = needle ? contacts.filter(row => `${row.name} ${row.phone ?? ""} ${row.email ?? ""}`.toLowerCase().includes(needle)) : contacts;
  return <div className={styles.page}>
    <div className={styles.heading}>
      <div><h1>Saved contacts</h1><p className={styles.sub}>{contacts.length} {contacts.length === 1 ? "person" : "people"} · private to you</p></div>
      {readOnly ? null : <Link href={`${CONTACTS_PATH}/new`} className={styles.btn} data-primary><PlusIcon className="size-3.5" strokeWidth={2.2} />Add</Link>}
    </div>
    {contacts.length ? <SearchBox label="Search contacts" value={query} onChange={setQuery} /> : null}
    {rows.length ? <div className={styles.panel}>
      <ul className={styles.list}>
        {rows.map(row => <li key={row.key} className={styles.row}>
          <Link href={`${CONTACTS_PATH}/${contactId(row.key)}`} className={styles.personLink}>
            <Initials name={row.name} />
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{row.name}</span><span className={styles.rowMeta}>{row.phone ?? "Phone not recorded"}</span></span>
          </Link>
          {!readOnly && row.phone ? <Link href={`${CONTACTS_PATH}/${contactId(row.key)}/invite`} className={`${styles.btn} ${styles.mini}`} data-primary>Invite</Link> : null}
        </li>)}
      </ul>
    </div> : <p className={`${styles.panel} ${styles.empty}`}>{query ? "No contacts match your search." : "No saved contacts yet. Add the people you meet in ministry."}</p>}
    <p className={styles.note}>🔒 Contacts never become group members on their own. They join only after enrolling and accepting your invite.</p>
  </div>;
}

type EnrolleeTab = "free" | "all";

/**
 * My enrollees, under Groups: people who signed up with the member's link or
 * code (or were assigned to them), with the ones not yet in a group first.
 */
export function EnrolleesList({ rows, referralUrl }: { rows: OwnEnrolleeRow[]; referralUrl: string | null }) {
  const free = rows.filter(row => !row.group);
  const [tab, setTab] = useState<EnrolleeTab>(free.length ? "free" : "all");
  const [copied, setCopied] = useState(false);
  const visible = tab === "free" ? free : rows;
  async function share() {
    if (!referralUrl) return;
    try {
      if (navigator.share) await navigator.share({ title: "Join SOGP", url: referralUrl });
      else { await navigator.clipboard.writeText(referralUrl); setCopied(true); }
    } catch { /* The share sheet was dismissed. */ }
  }
  const meta = (row: OwnEnrolleeRow) => row.lastContactedAt
    ? `Last contact ${day.format(new Date(row.lastContactedAt))}`
    : `${row.source === "code" || row.source === "link" ? "Signed up" : "Assigned"} ${day.format(new Date(row.assignedAt))}${row.invited ? " · invite sent" : ""}`;
  const end = (row: OwnEnrolleeRow) => row.group
    ? <span className={styles.pill} data-tone="ok" title={row.group.name ?? undefined}>{row.group.yours ? "In your group" : "In a group"}</span>
    : row.invited
      ? <span className={styles.pill}>Invited</span>
      : <Link href={`/dashboard/sogp/enrollees/${row.enrollmentId}/invite`} className={`${styles.btn} ${styles.mini}`} data-primary>Invite</Link>;

  return <div className={styles.page}>
    <div className={styles.heading}>
      <div><h1>My enrollees</h1><p className={styles.sub}>{rows.length} {rows.length === 1 ? "person" : "people"} you follow up</p></div>
      {referralUrl ? <button type="button" className={styles.btn} onClick={share}><Share2Icon className="size-3.5" strokeWidth={2} />{copied ? "Link copied" : "Share link"}</button> : null}
    </div>
    {rows.length ? <GroupTabs tabs={[{ key: "free", label: "Not in a group", count: free.length }, { key: "all", label: "All", count: rows.length }]} value={tab} onChange={setTab} /> : null}
    {visible.length ? <div className={styles.panel}>
      <ul className={styles.list}>
        {visible.map(row => <li key={row.enrollmentId} className={styles.row}>
          <Initials name={row.name} />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{row.name}</span><span className={styles.rowMeta}>{meta(row)}</span></span>
          {end(row)}
        </li>)}
      </ul>
    </div> : <p className={`${styles.panel} ${styles.empty}`}>{rows.length ? "Everyone you follow up is in a group." : "When someone joins with your code or link, they’ll appear here."}</p>}
    <p className={styles.note}>Invite picks one of your discipleship groups. They join after accepting in Pleros.</p>
  </div>;
}
