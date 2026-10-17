"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import { normalisePrivateContact, type MinistryContact } from "@/lib/community/reporting-v3";
import { PrivateContactFields, type PersistContact } from "./ministry-form";
import styles from "@/components/sogp/follow-up-invitations.module.css";
import people from "@/components/community/discipleship/discipleship-group.module.css";
import { groupIcon } from "@/components/community/groups/group-hero";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");
const contactHref = (key: string) => `/dashboard/community/contacts/${key.split(":")[1]}`;

/**
 * Paper: saved_contacts. Private contacts only. Contact collections, account
 * linking and invitation statuses are unapproved proposals, so every contact
 * reads as "Unlinked contact" and no collection filter is offered.
 */
export function SavedContacts({ contacts, readOnly }: { contacts: MinistryContact[]; readOnly: boolean }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = needle ? contacts.filter(row => `${row.name} ${row.phone ?? ""} ${row.email ?? ""}`.toLowerCase().includes(needle)) : contacts;
  return <section className={styles.page}>
    <div className={styles.heading}><span className={styles.eyebrow}>Saved contacts</span><h1>People, kept close</h1><p>{contacts.length} {contacts.length === 1 ? "contact" : "contacts"} · private to you</p></div>
    {readOnly ? null : <Link className={styles.primary} href="/dashboard/community/contacts/new">Add contact<DashboardIcon name="plus" /></Link>}
    <label className={styles.searchBox}><DashboardIcon name="search" size={20} /><span className="sr-only">Search contacts</span><input type="search" placeholder="Search contacts" value={query} onChange={event => setQuery(event.target.value)} /></label>
    {rows.length ? <ul className={styles.list}>{rows.map(row => <li key={row.key}><Link className={styles.row} href={contactHref(row.key)}>
      <span className={styles.avatar}>{initials(row.name)}</span>
      <div><strong>{row.name}</strong><span className={styles.meta}>{row.phone ?? "Phone not recorded"}</span><StatusPill tone="neutral">Unlinked contact</StatusPill></div>
      <DashboardIcon name="right" size={16} />
    </Link></li>)}</ul> : <p className={styles.muted}>{query ? "No contacts match your search." : "No saved contacts yet. Add the people you meet in ministry."}</p>}
  </section>;
}

/** Paper: add_contact (standalone). Name and phone required; saving never creates an account, invitation or membership. */
export function AddSavedContact({ onPersist, inviteGroups = [], initialInviteGroupId = null }: {
  onPersist: PersistContact;
  /** Discipleship groups the viewer leads; picking one opens the WhatsApp invite after saving. */
  inviteGroups?: Array<{ id: number; name: string }>;
  initialInviteGroupId?: number | null;
}) {
  const router = useRouter();
  const [inviteTo, setInviteTo] = useState<string>(initialInviteGroupId ? String(initialInviteGroupId) : "");
  const [value, setValue] = useState({ name: "", phone: "", email: "", note: "" });
  const [error, setError] = useState<{ field: "name" | "phone" | "email" | "note"; message: string }>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestKey = useRef<string | null>(null);
  function save() {
    if (busy) return;
    const parsed = normalisePrivateContact(value);
    if (!parsed.ok) { setError({ field: parsed.field, message: parsed.error }); requestAnimationFrame(() => document.getElementById(`private-contact-${parsed.field}`)?.focus()); return; }
    setError(undefined); setServerError(null); setBusy(true);
    requestKey.current ??= crypto.randomUUID();
    startTransition(async () => {
      try {
        const result = await onPersist({ ...parsed.value, requestKey: requestKey.current! });
        if (result.ok) router.push(inviteTo ? `${contactHref(result.value.key)}/invite?group=${inviteTo}` : contactHref(result.value.key)); else setServerError(result.error);
      } catch { setServerError("Your contact could not be saved. Your entries are still here. Try again."); }
      finally { setBusy(false); }
    });
  }
  // Same frame as the people screens under Groups (user request: the redesign reaches every state).
  return <div className={people.page}>
    <div className={people.heading}><div><h1>Add a contact</h1><p className={people.sub}>Private to you · no Pleros account needed</p></div></div>
    <fieldset disabled={busy} className={`${people.panel} ${people.form}`} style={{ margin: 0 }}><legend className="sr-only">Contact details</legend>
      <PrivateContactFields value={value} update={patch => setValue(current => ({ ...current, ...patch }))} error={error} />
    </fieldset>
    {inviteGroups.length ? <>
      <div className={people.sectionTitle}><h2>Invite to a group</h2><span className={people.rowMeta}>Optional</span></div>
      <div className={people.panel} role="radiogroup" aria-label="Invite to a group">
        <ul className={people.list}>
          {[{ id: 0, name: "Don’t invite yet" }, ...inviteGroups].map((group, index) => <li key={group.id}>
            <label className={people.row} style={{ cursor: "pointer" }}>
              <input type="radio" name="invite-group" checked={inviteTo === (group.id ? String(group.id) : "")} onChange={() => setInviteTo(group.id ? String(group.id) : "")} className="size-[18px] shrink-0 accent-[var(--color-community-blue)]" />
              {group.id
                ? <span className="size-10 shrink-0 rounded-[10px] bg-cover bg-center" aria-hidden="true" style={{ backgroundColor: index % 2 === 0 ? "#e6ecfc" : "#e3d8f8", ...groupIcon(index % 2 === 0 ? "leading-slate" : "leading") }} />
                : <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#f1f2f5] text-[var(--color-community-muted)]" aria-hidden="true"><DashboardIcon name="close" size={16} /></span>}
              <span className={people.rowCopy}><span className={people.rowTitle}>{group.name}</span><span className={people.rowMeta}>{group.id ? "Share its invite on WhatsApp after saving" : "Just save them for now"}</span></span>
            </label>
          </li>)}
        </ul>
      </div>
    </> : null}
    {serverError ? <p role="alert" className={people.error}>{serverError}</p> : null}
    <button type="button" className={people.share} style={{ border: 0 }} disabled={busy} onClick={save}>{busy ? "Saving…" : inviteTo ? "Save and invite" : "Save contact"}</button>
    <p className={people.note}>🔒 Private to you. Saving won’t create an account or add them to a group; they join only after enrolling and accepting.</p>
  </div>;
}

export type SavedContactDetail = {
  id: number; name: string; phone: string; email: string | null; note: string | null; createdAt: string; phoneHref: string | null;
  history: { activityId: number; date: string; kind: string }[];
};
const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit", hour12: true });
const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "long", year: "numeric" });
const kindLabel: Record<string, string> = { outreach: "Evangelism report", follow_up: "Discipleship report", teaching_meeting: "Teaching meeting", prayer_meeting: "Prayer meeting" };

/** Paper: contact_history. Owner-only; collections and moving are not offered. */
export function SavedContactDetailView({ contact }: { contact: SavedContactDetail }) {
  const saved = new Date(contact.createdAt);
  return <section className={styles.page}>
    <div className={styles.centred}>
      <span className={`${styles.avatar} ${styles.avatarLarge}`}>{initials(contact.name)}</span>
      <h1>{contact.name}</h1>
      {contact.phoneHref ? <a className={styles.textLink} href={contact.phoneHref}>{contact.phone}</a> : <span className={styles.muted}>{contact.phone}</span>}
      {contact.email ? <span className={styles.meta}>{contact.email}</span> : null}
      <StatusPill tone="neutral">Unlinked contact</StatusPill>
    </div>
    <div className={styles.section}><h2>Note</h2>{contact.note ? <div className={styles.card}><p style={{ whiteSpace: "pre-wrap" }}>{contact.note}</p><span className={styles.meta}>Stored with this saved contact.</span></div> : <p className={styles.muted}>No note saved.</p>}</div>
    <div className={styles.section}><h2>Activity history</h2>
      <ul className={styles.list}>
        {[...contact.history].reverse().map(row => <li key={row.activityId}><Link className={styles.row} href={`/dashboard/community/report/${row.activityId}`}>
          <span className={styles.avatar}><DashboardIcon name="calendar" size={16} /></span>
          <div><strong>{kindLabel[row.kind] ?? "Report"}</strong><span className={styles.meta}>{day.format(new Date(`${row.date}T12:00:00Z`))} · Included in your report</span></div>
          <DashboardIcon name="right" size={16} />
        </Link></li>)}
        <li className={styles.row}><span className={styles.avatar}><DashboardIcon name="plus" size={16} /></span><div><strong>Contact saved</strong><span className={styles.meta}>{day.format(saved)} · {time.format(saved)} · Added by you</span></div></li>
      </ul>
    </div>
    <Link className={styles.secondary} href={`/dashboard/community/contacts/${contact.id}/invite`}>Invite to a group on WhatsApp</Link>
    <div className={styles.info}><DashboardIcon name="lock" size={16} /><p>Only you can see this contact. No account, invitation or membership has been created.</p></div>
    <Link className={styles.textLink} href="/dashboard/community/contacts">Back to saved contacts</Link>
  </section>;
}
