"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { acceptFollowUpOwner, answerGroupInvitation, inviteEnrolleeToGroup, withdrawGroupInvitation } from "@/app/_actions/sogp-invitation-actions";
import type { FollowUpWelcome as WelcomeData, OwnEnrolleeRow } from "@/lib/db/queries/sogp-follow-up-routes";
import type { ReceivedInvitation, SentInvitation } from "@/lib/db/queries/sogp-group-invitations";
import styles from "./follow-up-invitations.module.css";

function StatusPill({ children, tone }: { children: ReactNode; tone: "blue" | "green" | "amber" | "neutral" | "lilac" }) {
  return <span className={styles.pill} data-tone={tone === "amber" ? "todo" : tone === "blue" || tone === "green" ? "done" : undefined}>{children}</span>;
}

const first = (name: string) => name.trim().split(/\s+/)[0] || name;
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");
const lagos = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short" });
const lagosTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit", hour12: true });
function relativeDay(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : days < 7 ? `${days} days ago` : lagos.format(new Date(iso));
}

/** Paper: Pleros-referral-code / Pleros-referral-link. */
export function FollowUpWelcome({ data }: { data: WelcomeData & { ownerName: string } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const owner = first(data.ownerName);

  if (data.source === "code") return <section className={styles.page}>
    <div className={styles.heading}><StatusPill tone="blue">Joined with a code</StatusPill></div>
    <div className={styles.centred}><span className={styles.check}><DashboardIcon name="circlecheck" size={24} /></span><h1>You’re in, {data.learnerFirstName}.</h1><p className={styles.muted}>Your SOGP journey starts here.</p></div>
    <div className={styles.panel}>
      <span className={styles.meta}>Your follow-up person</span>
      <div className={styles.person}><span className={`${styles.avatar} ${styles.avatarLarge}`}>{initials(data.ownerName)}</span><div><strong>{data.ownerName}</strong><span className={styles.meta}>Here to help you settle in</span></div></div>
      {data.ownerCode ? <div className={styles.codeRow}><span>Referral code</span><strong>{data.ownerCode}</strong></div> : null}
    </div>
    <p>You’ve been assigned to {owner} because you joined with their referral code.</p>
    <div className={styles.info}><DashboardIcon name="people" size={16} /><p>Your follow-up assignment is ready. Group invitations are a separate step.</p></div>
    <Link className={styles.textLink} href="/dashboard/sogp/follow-up">Need help with your assignment?</Link>
    <footer className={styles.footer}><Link className={styles.primary} href="/dashboard/sogp">Start learning<DashboardIcon name="arrow" /></Link></footer>
  </section>;

  const awaiting = data.choice === null && data.ownerCurrent;
  return <section className={styles.page}>
    <div className={styles.heading}><StatusPill tone="blue">Joined through a link</StatusPill><h1>Meet your follow-up person</h1><p>You joined through {owner}’s invitation link.</p></div>
    <div className={styles.ownerPanel}>
      <span className={styles.avatar}>{initials(data.ownerName)}</span>
      <strong>{data.ownerName}</strong>
      <span className={styles.muted}>Assigned from your referral link</span>
      {awaiting ? <StatusPill tone="amber">Awaiting your choice</StatusPill> : data.choice === "requested" ? <StatusPill tone="amber">Request pending</StatusPill> : <StatusPill tone="green">Accepted</StatusPill>}
    </div>
    {awaiting ? <div className={styles.section}>
      <div><h2>Would you like {owner} to follow up with you?</h2><p className={styles.muted}>Accept {owner}, or ask for someone else.</p></div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={pending} onClick={() => start(async () => { setError(null); const result = await acceptFollowUpOwner(); if (result.ok) router.refresh(); else setError(result.error); })}>Accept {owner}<DashboardIcon name="check" /></button>
        <Link className={styles.secondary} href="/dashboard/sogp/follow-up">Request someone else</Link>
      </div>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </div> : null}
    <div className={styles.info}><DashboardIcon name="shield" size={16} /><p>This choice is for follow-up support. Joining a group is a separate step.</p></div>
    <div className={styles.later}><Link className={styles.textLink} href="/dashboard/sogp">Start learning now</Link>{awaiting ? <span className={styles.meta}>You can make this choice later.</span> : null}</div>
  </section>;
}

/** Paper: Pleros-my-enrollees. Learner-facing; names and dates only. */
export function MyEnrollees({ rows, referralCode, referralUrl }: { rows: OwnEnrolleeRow[]; referralCode: string | null; referralUrl: string | null }) {
  const [tab, setTab] = useState<"follow" | "all">("follow");
  const [copied, setCopied] = useState(false);
  const [now] = useState(() => Date.now());
  const needsAttention = (row: OwnEnrolleeRow) => !row.lastContactedAt || now - new Date(row.lastContactedAt).getTime() > 2 * 86_400_000;
  const visible = tab === "follow" ? rows.filter(needsAttention) : rows;
  async function share() {
    if (!referralUrl) return;
    try {
      if (navigator.share) await navigator.share({ title: "Join SOGP", url: referralUrl });
      else { await navigator.clipboard.writeText(referralUrl); setCopied(true); }
    } catch { /* The share sheet was dismissed. */ }
  }
  const label = (row: OwnEnrolleeRow) => row.source === "code" ? "Your referral code" : row.source === "link" ? "Your referral link" : row.source === "geography" ? "Your area" : row.source === "reassigned" ? "Reassigned to you" : "Assigned to you";
  const pill = (row: OwnEnrolleeRow) => !row.lastContactedAt ? (row.source === "reassigned" ? <StatusPill tone="blue">New owner</StatusPill> : <StatusPill tone="blue">New</StatusPill>) : needsAttention(row) ? <StatusPill tone="amber">Follow up</StatusPill> : <StatusPill tone="green">Contacted</StatusPill>;
  return <section className={styles.page}>
    <div className={styles.heading}><span className={styles.eyebrow}>Your follow-up</span><h1>People you support</h1><p>Your assigned enrollees, across all sources.</p></div>
    {referralCode ? <div className={styles.referralPanel}>
      <div><span className={styles.meta}>Your referral</span><span className={styles.code}>{referralCode}</span></div>
      <button type="button" className={styles.share} onClick={share}>{copied ? "Link copied" : "Share"}<DashboardIcon name="arrow" /></button>
      <span className={styles.note}>Code assigns directly. Link offers a choice.</span>
    </div> : null}
    <div className={styles.section}>
      <div className={styles.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === "follow"} onClick={() => setTab("follow")}>To follow up</button>
        <button type="button" role="tab" aria-selected={tab === "all"} onClick={() => setTab("all")}>All enrollees</button>
      </div>
      <span className={styles.meta}>{tab === "follow" ? (visible.length ? `${visible.length} need${visible.length === 1 ? "s" : ""} your attention` : "Nobody needs your attention right now.") : `${rows.length} assigned to you`}</span>
      <ul className={styles.list}>
        {visible.map(row => <li key={row.enrollmentId}><Link className={styles.row} href={`/dashboard/sogp/enrollees/${row.enrollmentId}/invite`}>
          <span className={styles.avatar}>{initials(row.name)}</span>
          <div><strong>{row.name}</strong><span className={styles.meta}>{row.lastContactedAt ? `Last contact · ${relativeDay(row.lastContactedAt)}` : `${label(row)} · ${relativeDay(row.assignedAt)}`}</span>{pill(row)}</div>
          <DashboardIcon name="right" size={16} />
        </Link></li>)}
      </ul>
      {!rows.length ? <p className={styles.muted}>When someone joins with your code or link, they’ll appear here.</p> : null}
    </div>
    <div className={styles.info}><DashboardIcon name="shield" size={16} /><p>Showing your assigned enrollees.</p></div>
  </section>;
}

/** Paper: Pleros-group-invitation-accept. */
export function InvitationResponse({ invitation }: { invitation: ReceivedInvitation }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sharesPhone, setSharesPhone] = useState(false);
  const leader = first(invitation.leaderName);
  const answer = (accept: boolean) => start(async () => {
    setError(null);
    const result = await answerGroupInvitation({ invitationId: invitation.id, accept, sharesPhone });
    if (!result.ok) { setError(result.error); return; }
    router.push(result.status === "accepted" ? "/dashboard/community/discipleship" : "/dashboard/community");
  });
  const open = invitation.status === "pending" && invitation.groupAvailable;
  return <section className={styles.page}>
    <div className={styles.heading}><h1>{invitation.status === "accepted" ? "You joined this group" : invitation.status === "declined" ? "Invitation declined" : "You’re invited"}</h1><p>{invitation.leaderName} invited you to join.</p></div>
    <div className={styles.heading}><StatusPill tone={invitation.status === "pending" ? "blue" : invitation.status === "accepted" ? "green" : "neutral"}>Group invitation</StatusPill></div>
    <div className={styles.card}><span className={styles.meta}>Discipleship group</span><strong>{invitation.groupName}</strong><span className={styles.meta}>Led by {invitation.leaderName}</span></div>
    {open ? <>
      <div className={styles.section}><h2>Before you join</h2><p>Accepting makes you a member of this group. You can also decline this invitation.</p></div>
      <div className={styles.section}><h2>Your learning continues</h2><p>Your SOGP follow-up assignment is separate from joining this group.</p></div>
      <label className={styles.consent}><input type="checkbox" checked={sharesPhone} onChange={event => setSharesPhone(event.target.checked)} />Let {leader} message me on WhatsApp.</label>
      <span className={styles.meta}>You haven’t joined this group yet.</span>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      <footer className={styles.footer}>
        <button type="button" className={styles.primary} disabled={pending} onClick={() => answer(true)}>Accept invitation<DashboardIcon name="check" /></button>
        <button type="button" className={styles.quiet} disabled={pending} onClick={() => answer(false)}>Decline</button>
      </footer>
    </> : <p className={styles.muted}>{invitation.status === "pending" ? "This group isn’t taking new members right now." : invitation.status === "withdrawn" ? "This invitation was withdrawn." : "You’ve already responded to this invitation."}</p>}
  </section>;
}

/** Paper: Pleros-invite-existing-account, for someone the leader already follows up with. */
export function InviteEnrollee({ enrollee, groups, leaderName }: { enrollee: { enrollmentId: number; name: string; maskedEmail: string }; groups: { id: number; name: string }[]; leaderName: string }) {
  const router = useRouter();
  const [groupId, setGroupId] = useState(groups[0]?.id ?? 0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const name = first(enrollee.name);
  return <section className={styles.page}>
    <div className={styles.heading}><h1>Invite {enrollee.name}</h1><p>Review the person and group before sending.</p></div>
    <div className={styles.heading}><StatusPill tone="blue">In-app invitation</StatusPill></div>
    <div className={styles.section}><h2>Recipient account</h2><div className={styles.card}><strong>{enrollee.name}</strong><span className={styles.meta}>{enrollee.maskedEmail}</span></div>
      <div><p>Confirm this is the right person.</p><span className={styles.meta}>You follow up with {name}. Matching details don’t link accounts automatically.</span></div></div>
    <div className={styles.section}><h2>Discipleship group</h2>
      {groups.length ? groups.map(group => <label key={group.id} className={styles.card}>
        <span className={styles.person}>{groups.length > 1 ? <input type="radio" name="group" checked={groupId === group.id} onChange={() => setGroupId(group.id)} /> : null}<span><strong>{group.name}</strong><span className={styles.meta}>Led by {leaderName}</span></span></span>
      </label>) : <p className={styles.muted}>You don’t lead an active group yet. Open My disciples to start one.</p>}
    </div>
    <div className={styles.info}><DashboardIcon name="shield" size={16} /><p>{name} must accept before joining. Their contact details stay private.</p></div>
    <span className={styles.meta}>The invitation will be sent in Pleros.</span>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <footer className={styles.footer}><button type="button" className={styles.primary} disabled={pending || !groups.length} onClick={() => start(async () => {
      setError(null);
      const result = await inviteEnrolleeToGroup({ groupId, enrollmentId: enrollee.enrollmentId });
      if (result.ok) router.push(`/dashboard/sogp/invitations/${result.invitationId}/sent`); else setError(result.error);
    })}>Send in-app invitation<DashboardIcon name="send" /></button></footer>
  </section>;
}

/** Paper: Pleros-group-invitation-pending. */
export function SentInvitationView({ invitation }: { invitation: SentInvitation }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const name = first(invitation.recipientName);
  const sentAt = new Date(invitation.createdAt);
  const title = invitation.status === "pending" ? `Waiting for ${name}` : invitation.status === "accepted" ? `${name} joined your group` : invitation.status === "declined" ? `${name} declined` : "Invitation withdrawn";
  return <section className={styles.page}>
    <div className={styles.heading}><h1>{title}</h1><p>Invitation sent in Pleros.</p></div>
    <div className={styles.heading}>{invitation.status === "pending" ? <StatusPill tone="amber">Pending acceptance</StatusPill> : invitation.status === "accepted" ? <StatusPill tone="green">Accepted</StatusPill> : <StatusPill tone="neutral">{invitation.status === "declined" ? "Declined" : "Withdrawn"}</StatusPill>}</div>
    <div className={styles.section}><h2>Sent to</h2><div className={styles.card}><strong>{invitation.recipientName}</strong><span className={styles.meta}>{lagos.format(sentAt)} · {lagosTime.format(sentAt)}</span></div></div>
    <div className={styles.section}><h2>Discipleship group</h2><div className={styles.card}><strong>{invitation.groupName}</strong><span className={styles.meta}>Led by {invitation.leaderName}</span></div></div>
    {invitation.status === "pending" ? <div className={styles.section}><h2>Not a member yet</h2><p>{name} can accept or decline the invitation. They’ll join the group only after accepting.</p></div> : null}
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <footer className={styles.footer}>
      <Link className={styles.primary} href={`/dashboard/community/discipleship/${invitation.groupId}`}>View your group<DashboardIcon name="arrow" /></Link>
      {invitation.status === "pending" ? <button type="button" className={styles.quiet} disabled={pending} onClick={() => start(async () => { const result = await withdrawGroupInvitation(invitation.id); if (result.ok) router.refresh(); else setError(result.error); })}>Withdraw invitation</button> : null}
    </footer>
  </section>;
}
