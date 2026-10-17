"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon, MessageCircleIcon, PhoneIcon, UserPlusIcon } from "lucide-react";

import { logFollowUpAction, recordContactInviteAction } from "@/app/(site)/dashboard/community/_actions/people-actions";
import { inviteEnrolleeToGroup, withdrawGroupInvitation } from "@/app/_actions/sogp-invitation-actions";
import type { FollowUpEntry, FollowUpKind, OwnEnrollee } from "@/lib/db/queries/people-follow-ups";
import type { SentInvitation } from "@/lib/db/queries/sogp-group-invitations";

import styles from "../discipleship/discipleship-group.module.css";
import { Initials } from "../discipleship/shared";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });
const longDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Lagos" });
const clock = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" });
const firstOf = (name: string) => name.trim().split(/\s+/)[0] || name;

const KIND_LABEL: Record<FollowUpKind, string> = { whatsapp: "WhatsApp", call: "Call", visit: "Visit", message: "Message", note: "Note" };
const KIND_ICON: Record<FollowUpKind, string> = { whatsapp: "✆", call: "☏", visit: "⌂", message: "✉", note: "✎" };
const SOURCE: Record<OwnEnrollee["source"], string> = { code: "Your referral code", link: "Your referral link", geography: "Your area", reassigned: "Reassigned to you", assigned: "Assigned to you" };

type Subject = { enrollmentId: number } | { privateContactId: number };

function Tag({ tone, children }: { tone?: "ok" | "risk"; children: React.ReactNode }) {
  return <span className={styles.pill} data-tone={tone}>{children}</span>;
}

/** WhatsApp and Call that also log the follow-up, so the person's last contact stays true. */
function ContactButtons({ subject, whatsappUrl, callHref, firstName }: { subject: Subject; whatsappUrl: string | null; callHref: string | null; firstName: string }) {
  const log = (kind: FollowUpKind) => { void logFollowUpAction({ ...subject, kind }); };
  return <>
    {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.btn} onClick={() => log("whatsapp")} aria-label={`WhatsApp ${firstName}`}><MessageCircleIcon className="size-3.5 text-[#128c4a]" strokeWidth={2.2} />WhatsApp</a> : null}
    {callHref ? <a href={callHref} className={styles.btn} style={{ width: 32, padding: 0 }} onClick={() => log("call")} aria-label={`Call ${firstName}`} title="Call"><PhoneIcon className="size-3.5 text-[var(--color-community-blue)]" strokeWidth={2.2} /></a> : null}
  </>;
}

/** The owner's private follow-up log with one person, and the form that adds to it. */
export function FollowUpLog({ subject, firstName, entries, extra, startOpen = false }: {
  subject: Subject; firstName: string; entries: FollowUpEntry[];
  /** Read-only history rows merged in by date (reports a contact was part of, when they were saved). */
  extra?: Array<{ key: string; icon: string; title: string; meta: string; at: string; href?: string }>;
  startOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [kind, setKind] = useState<FollowUpKind>("call");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const rows = [
    ...entries.map(entry => ({ key: `log-${entry.id}`, icon: KIND_ICON[entry.kind], title: KIND_LABEL[entry.kind], meta: `${longDay.format(new Date(entry.createdAt))}${entry.note ? ` · “${entry.note}”` : ""}`, at: entry.createdAt, href: undefined as string | undefined })),
    ...(extra ?? []),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return <>
    <div className={styles.sectionTitle} id="follow-ups">
      <h2>Follow-ups</h2>
      <button type="button" className={styles.quiet} onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Cancel" : "Log a follow-up"}</button>
    </div>
    {open ? <form className={`${styles.panel} ${styles.form}`} onSubmit={event => {
      event.preventDefault();
      setError(null);
      start(async () => {
        const result = await logFollowUpAction({ ...subject, kind, note });
        if (!result.ok) { setError(result.error); return; }
        setNote(""); setOpen(false); router.refresh();
      });
    }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>How did you follow up with {firstName}?</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Follow-up type">
        {(Object.keys(KIND_LABEL) as FollowUpKind[]).map(option => <button key={option} type="button" role="radio" aria-checked={kind === option} onClick={() => setKind(option)}
          className={`${styles.btn} ${styles.mini}`} data-primary={kind === option ? "" : undefined}>{KIND_LABEL[option]}</button>)}
      </div>
      <input type="text" value={note} maxLength={500} onChange={event => setNote(event.target.value)} placeholder="Short private note (optional)" aria-label="Private note" />
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      <div className={styles.formActions}><button type="submit" className={styles.btn} data-primary disabled={pending}>{pending ? "Saving…" : "Save follow-up"}</button></div>
    </form> : null}
    {rows.length ? <div className={styles.panel}>
      <ul className={styles.list}>
        {rows.map(row => {
          const body = <>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f1f2f5] text-[12px]" aria-hidden="true">{row.icon}</span>
            <span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>{row.title}</span><span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>{row.meta}</span></span>
          </>;
          return <li key={row.key}>{row.href ? <Link href={row.href} className={styles.row}>{body}</Link> : <div className={styles.row}>{body}</div>}</li>;
        })}
      </ul>
    </div> : <p className={`${styles.panel} ${styles.empty}`}>No follow-ups yet. WhatsApp and calls from here are logged for you.</p>}
  </>;
}

/** One enrollee the viewer follows up: how they joined, how to reach them, and getting them into a group. */
export function EnrolleeDetail({ enrollee, followUps }: { enrollee: OwnEnrollee; followUps: FollowUpEntry[] }) {
  const subject = { enrollmentId: enrollee.enrollmentId };
  const inYours = enrollee.group?.yours && enrollee.group.groupId != null && enrollee.group.membershipId != null;
  const primary = inYours
    ? <Link href={`/dashboard/community/discipleship/${enrollee.group!.groupId}/disciples/${enrollee.group!.membershipId}`} className={styles.btn} data-primary>Open disciple page</Link>
    : enrollee.group ? null
      : enrollee.invitation
        ? <Link href={`/dashboard/community/invitations/${enrollee.invitation.id}/sent`} className={styles.btn} data-primary>View invitation</Link>
        : <Link href={`/dashboard/community/enrollees/${enrollee.enrollmentId}/invite`} className={styles.btn} data-primary><UserPlusIcon className="size-3.5" strokeWidth={2} />Invite to a group</Link>;
  const status = enrollee.group ? <Tag tone="ok">{enrollee.group.yours ? "In your group" : "In a group"}</Tag> : enrollee.invitation ? <Tag>Invited</Tag> : <Tag tone="risk">Not in a group</Tag>;

  return <div className={styles.page}>
    <div className={styles.profile}>
      <Initials name={enrollee.name} size="lg" />
      <div className="grid min-w-0 gap-1">
        <h1>{enrollee.name}</h1>
        <span className={styles.profileMeta}>{enrollee.cohortName}</span>
        <span className="flex flex-wrap gap-1.5"><Tag>{SOURCE[enrollee.source]}</Tag>{status}</span>
      </div>
    </div>
    <div className={styles.actions} style={{ justifyContent: "flex-end" }}>
      {primary}
      <ContactButtons subject={subject} whatsappUrl={enrollee.whatsappUrl} callHref={enrollee.callHref} firstName={enrollee.firstName} />
    </div>

    <div className={styles.panel}>
      <div className={styles.kv}><span>Phone</span><b>{enrollee.phone || "Not recorded"}</b></div>
      {enrollee.region ? <div className={styles.kv}><span>Location</span><b>{enrollee.region}</b></div> : null}
      <div className={styles.kv}><span>Assigned to you</span><b>{day.format(new Date(enrollee.assignedAt))}</b></div>
      <div className={styles.kv}><span>Last contact</span><b>{enrollee.lastContactedAt ? `${day.format(new Date(enrollee.lastContactedAt))} · ${enrollee.contactCount} time${enrollee.contactCount === 1 ? "" : "s"}` : "Not yet"}</b></div>
      {enrollee.invitation ? <div className={styles.kv}><span>Invited to</span><b>{enrollee.invitation.groupName}</b></div> : null}
    </div>

    <FollowUpLog subject={subject} firstName={enrollee.firstName} entries={followUps} />

    <p className={styles.note}>🔒 Their phone number and your follow-ups are only for you as their follow-up person. Progress and answers show once they join one of your groups.</p>
  </div>;
}

export type ContactInviteGroup = { id: number; name: string; inviteUrl: string; discipleCount: number; colourway: "lilac" | "slate" };

/** The shared invite screen: pick one of your groups, preview what they'll see, then send. */
export function InvitePerson({ person, groups, leaderFirstName, initialGroupId }: {
  person: { kind: "enrollee"; enrollmentId: number; name: string; whatsappUrl: string | null } | { kind: "contact"; privateContactId: number; name: string; whatsappBase: string | null };
  groups: ContactInviteGroup[];
  leaderFirstName: string;
  initialGroupId?: number;
}) {
  const router = useRouter();
  const [groupId, setGroupId] = useState(initialGroupId ?? groups[0]?.id ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const group = groups.find(item => item.id === groupId);
  const first = firstOf(person.name);
  const preview = group ? (person.kind === "enrollee"
    ? `${leaderFirstName} invited you to join ${group.name}. Accept to walk through SOGP together.`
    : `Hi ${first}, join ${group.name} on Pleros. Create an account, then accept the group invitation when you’re ready. ${group.inviteUrl}`) : "";
  const whatsapp = group ? (person.kind === "contact"
    ? person.whatsappBase ? `${person.whatsappBase}?text=${encodeURIComponent(preview)}` : null
    : person.whatsappUrl ? `${person.whatsappUrl.split("?")[0]}?text=${encodeURIComponent(`Hi ${first}, I’ve invited you to ${group.name} on Pleros. Open the app to accept: ${group.inviteUrl}`)}` : null) : null;

  if (!groups.length) return <div className={styles.page}>
    <div className={styles.profile}><Initials name={person.name} /><div className="grid min-w-0"><h1 style={{ fontSize: 19, lineHeight: "25px" }}>Invite {first}</h1></div></div>
    <p className={`${styles.panel} ${styles.empty}`}>You don’t lead an active discipleship group yet. Open Groups to start one.</p>
    <Link href="/dashboard/community/groups" className={styles.btn} data-primary style={{ justifySelf: "end" }}>Go to Groups</Link>
  </div>;

  return <div className={styles.page}>
    <div className={styles.profile}><Initials name={person.name} /><div className="grid min-w-0"><h1 style={{ fontSize: 19, lineHeight: "25px" }}>Invite {first}</h1><span className={styles.profileMeta}>Choose one of your discipleship groups</span></div></div>
    <div className={styles.panel} role="radiogroup" aria-label="Discipleship group">
      <ul className={styles.list}>
        {groups.map(item => <li key={item.id}>
          <label className={styles.row} style={{ cursor: "pointer" }}>
            <input type="radio" name="invite-group" checked={groupId === item.id} onChange={() => setGroupId(item.id)} className="size-[18px] shrink-0 accent-[var(--color-community-blue)]" />
            <span className="size-10 shrink-0 rounded-[10px] bg-cover bg-right-bottom" aria-hidden="true" style={{ backgroundColor: item.colourway === "slate" ? "#e6ecfc" : "#e3d8f8", backgroundImage: `url(/assets/dashboard/community-groups/${item.colourway === "slate" ? "leading-slate" : "leading"}-compact-320.webp)` }} />
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{item.name}</span><span className={styles.rowMeta}>{item.discipleCount ? `${item.discipleCount} ${item.discipleCount === 1 ? "disciple" : "disciples"}` : "No disciples yet"}</span></span>
          </label>
        </li>)}
      </ul>
    </div>
    {group ? <div className={`${styles.panel} ${styles.tools}`}>
      <span className={styles.rowMeta}>What {first} will see</span>
      <p style={{ margin: 0, padding: "10px 12px", borderRadius: 10, background: "#f6f7f9", fontSize: 13, lineHeight: "20px", overflowWrap: "anywhere" }}>{preview}</p>
    </div> : null}
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <div className="grid gap-2">
      {person.kind === "enrollee" ? <>
        <button type="button" className={styles.share} disabled={pending || !group} onClick={() => start(async () => {
          setError(null);
          const result = await inviteEnrolleeToGroup({ groupId, enrollmentId: person.enrollmentId });
          if (result.ok) router.push(`/dashboard/community/invitations/${result.invitationId}/sent`); else setError(result.error);
        })} style={{ border: 0 }}>{pending ? "Sending…" : "Send invitation in Pleros"}</button>
        {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={styles.btn} style={{ height: 38, justifyContent: "center" }}>Also tell them on WhatsApp</a> : null}
      </> : whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={styles.share} onClick={() => {
          void recordContactInviteAction({ privateContactId: person.privateContactId, groupId }).then(() => router.refresh());
          void logFollowUpAction({ privateContactId: person.privateContactId, kind: "whatsapp", note: `Invited to ${group?.name ?? "a group"}` });
        }}>Share on WhatsApp</a>
        : <button type="button" className={styles.share} style={{ border: 0 }} onClick={() => {
          void navigator.clipboard?.writeText(preview).catch(() => undefined);
          void recordContactInviteAction({ privateContactId: person.privateContactId, groupId });
        }}>Copy invitation message</button>}
    </div>
    <p className={styles.note}>{person.kind === "enrollee" ? `${first} joins only after accepting in Pleros.` : `${first} has no Pleros account yet, so the invite goes by WhatsApp. They join only after enrolling and accepting.`}</p>
  </div>;
}

/** After an in-app invitation is sent: its state, and the way back. */
export function InvitationSent({ invitation }: { invitation: SentInvitation }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const first = firstOf(invitation.recipientName);
  const sentAt = new Date(invitation.createdAt);
  const title = invitation.status === "pending" ? "Invitation sent" : invitation.status === "accepted" ? `${first} joined your group` : invitation.status === "declined" ? `${first} declined` : "Invitation withdrawn";
  const statusText = invitation.status === "pending" ? `Waiting for ${first}` : invitation.status === "accepted" ? "Accepted" : invitation.status === "declined" ? "Declined" : "Withdrawn";
  return <div className={styles.page}>
    <div className={styles.panel}>
      <div className="grid justify-items-center gap-2 px-4 pt-6 pb-5 text-center">
        <span className="grid size-[52px] place-items-center rounded-full bg-[#e4ebfd] text-[#2331ae]"><CheckIcon className="size-6" strokeWidth={2.2} /></span>
        <h1>{title}</h1>
        <span className={styles.profileMeta}>{invitation.status === "pending" ? `${first} can accept or decline in Pleros.` : invitation.status === "accepted" ? "They’re now one of your disciples." : "They aren’t in your group."}</span>
      </div>
    </div>
    <div className={styles.panel}>
      <div className={styles.kv}><span>Group</span><b>{invitation.groupName}</b></div>
      <div className={styles.kv}><span>Sent</span><b>{day.format(sentAt)}, {clock.format(sentAt)}</b></div>
      <div className={styles.kv}><span>Status</span><b style={{ color: invitation.status === "pending" ? "#2331ae" : undefined }}>{statusText}</b></div>
    </div>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <div className="grid gap-2">
      <Link href="/dashboard/community/enrollees" className={styles.share}>Back to My enrollees</Link>
      <Link href={`/dashboard/community/discipleship/${invitation.groupId}`} className={styles.btn} style={{ height: 38, justifyContent: "center" }}>View your group</Link>
      {invitation.status === "pending" ? <button type="button" className={styles.danger} style={{ justifySelf: "center", marginTop: 4 }} disabled={pending} onClick={() => start(async () => {
        const result = await withdrawGroupInvitation(invitation.id);
        if (result.ok) router.refresh(); else setError(result.error);
      })}>Withdraw invitation</button> : null}
    </div>
  </div>;
}


const REPORT_KIND: Record<string, string> = { outreach: "Evangelism report", follow_up: "Discipleship report", teaching_meeting: "Teaching meeting", prayer_meeting: "Prayer meeting" };

export type ContactDetailData = {
  id: number; name: string; phone: string; email: string | null; note: string | null; createdAt: string;
  whatsappUrl: string | null; callHref: string | null;
  history: Array<{ activityId: number; date: string; kind: string }>;
  invite: { groupName: string; at: string } | null;
};

/** One saved contact: how to reach them, the note, every follow-up and report, and the group invite. */
export function ContactDetail({ contact, followUps }: { contact: ContactDetailData; followUps: FollowUpEntry[] }) {
  const subject = { privateContactId: contact.id };
  const first = firstOf(contact.name);
  const saved = new Date(contact.createdAt);
  return <div className={styles.page}>
    <div className={styles.profile}>
      <Initials name={contact.name} size="lg" />
      <div className="grid min-w-0 gap-1">
        <h1>{contact.name}</h1>
        <span className={styles.profileMeta}>{contact.phone}{contact.email ? ` · ${contact.email}` : ""}</span>
        <span className="flex flex-wrap gap-1.5"><Tag>Saved {day.format(saved)}</Tag>{contact.invite ? <Tag>Invited to {contact.invite.groupName}</Tag> : <Tag tone="risk">Not invited yet</Tag>}</span>
      </div>
    </div>
    <div className={styles.actions} style={{ justifyContent: "flex-end" }}>
      <Link href={`/dashboard/community/contacts/${contact.id}/invite`} className={styles.btn} data-primary><UserPlusIcon className="size-3.5" strokeWidth={2} />{contact.invite ? "Invite again" : "Invite to a group"}</Link>
      <ContactButtons subject={subject} whatsappUrl={contact.whatsappUrl} callHref={contact.callHref} firstName={first} />
    </div>

    <div className={styles.sectionTitle}><h2>Note</h2></div>
    {contact.note ? <div className={`${styles.panel} ${styles.tools}`}><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{contact.note}</p></div> : <p className={`${styles.panel} ${styles.empty}`}>No note saved.</p>}

    <FollowUpLog subject={subject} firstName={first} entries={followUps} extra={[
      ...contact.history.map(row => ({ key: `report-${row.activityId}`, icon: "◎", title: REPORT_KIND[row.kind] ?? "Report", meta: `${longDay.format(new Date(`${row.date}T12:00:00Z`))} · in your report`, at: `${row.date}T12:00:00.000Z`, href: `/dashboard/community/report/${row.activityId}` })),
      ...(contact.invite ? [{ key: "invite", icon: "↗", title: `Invited to ${contact.invite.groupName}`, meta: `${longDay.format(new Date(contact.invite.at))} · shared on WhatsApp`, at: contact.invite.at }] : []),
      { key: "saved", icon: "+", title: "Contact saved", meta: `${longDay.format(saved)}, ${clock.format(saved)}`, at: contact.createdAt },
    ]} />

    <p className={styles.note}>🔒 Private to you. Saving a contact never creates an account or a group membership.</p>
  </div>;
}
