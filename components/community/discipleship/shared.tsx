"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import type { DiscipleshipActionResult } from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import { findGroupInvitees, inviteToGroupByName } from "@/app/_actions/sogp-invitation-actions";
import type { InviteCandidate } from "@/lib/db/queries/sogp-group-invitations";
import { useDiscipleshipAction } from "@/components/sogp/discipleship-check-ins";
import type { DiscipleSummary } from "@/lib/db/queries/sogp-discipleship";
import { buildDiscipleshipShareMessage } from "@/lib/sogp/discipleship";
import { buildPreSogpShareIntentUrl } from "@/lib/sogp/share";
import type { StudentStatus } from "@/lib/sogp/student-status";

import styles from "./discipleship-group.module.css";

/** The shared status classifier folded into the three states a leader acts on. */
export type StatusTone = "ok" | "risk" | "off";

const STATUS: Record<StudentStatus, { label: string; tone: StatusTone }> = {
  on_track: { label: "On track", tone: "ok" },
  day_inconsistent: { label: "Missing days", tone: "risk" },
  activity_inconsistent: { label: "Missing activities", tone: "risk" },
  generally_inconsistent: { label: "Inconsistent", tone: "risk" },
  declining: { label: "Slowing down", tone: "risk" },
  at_risk: { label: "At risk", tone: "risk" },
  unresponsive: { label: "Not active", tone: "off" },
};

export function statusOf(status: StudentStatus | null) {
  return status ? STATUS[status] : null;
}

const NEED: Record<StatusTone | "none", number> = { off: 0, risk: 1, none: 2, ok: 3 };

/** Who needs the leader first: not active, then wavering, then on track. */
export function byNeed(a: DiscipleSummary, b: DiscipleSummary) {
  const rank = (d: DiscipleSummary) => NEED[statusOf(d.status)?.tone ?? "none"];
  return rank(a) - rank(b) || a.firstName.localeCompare(b.firstName);
}

export function statusCounts(disciples: DiscipleSummary[]) {
  const counts = { ok: 0, risk: 0, off: 0 };
  for (const disciple of disciples) {
    const tone = statusOf(disciple.status)?.tone;
    if (tone) counts[tone] += 1;
  }
  return counts;
}

export function Dot({ tone }: { tone?: StatusTone | null }) {
  return <i className={styles.dot} data-tone={tone ?? undefined} aria-hidden="true" />;
}

export function StatusPill({ status }: { status: StudentStatus | null }) {
  const shown = statusOf(status);
  return shown ? <span className={styles.pill} data-tone={shown.tone}>{shown.label}</span> : null;
}

function initialsOf(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
}

/** Initials on one of four warm-to-cool tones, stable per name. */
export function Initials({ name, status, size }: { name: string; status?: StudentStatus | null; size?: "lg" }) {
  const tone = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  return <span className={styles.avatar} data-tone={tone} data-size={size} aria-hidden="true">
    {initialsOf(name)}
    {status !== undefined ? <Dot tone={statusOf(status)?.tone} /> : null}
  </span>;
}

export function Meter({ value, max }: { value: number | null; max: number | null }) {
  const share = value !== null && max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <span className={styles.meter} aria-hidden="true"><i style={{ width: `${share}%` }} /></span>;
}

export function StatusStrip({ disciples }: { disciples: DiscipleSummary[] }) {
  const counts = statusCounts(disciples);
  return <div className={styles.strip} aria-label="How your members are doing">
    <div><strong>{counts.ok}</strong><span><Dot tone="ok" />On track</span></div>
    <div><strong>{counts.risk}</strong><span><Dot tone="risk" />At risk</span></div>
    <div><strong>{counts.off}</strong><span><Dot tone="off" />Not active</span></div>
  </div>;
}

/** The group's own invite link: copy, share on WhatsApp, the leader's number consent and a fresh link. */
const CANDIDATE_NOTE: Record<InviteCandidate["state"], string> = {
  free: "Not in a group yet",
  in_a_group: "In another group · they’d stay in it too",
  full: "In five groups, the most anyone can be in",
  in_this_group: "Already in this group",
  invited: "Invited · waiting for them to accept",
};

/**
 * Add someone to the group by name (groups as oversight, 19 October). It sends
 * an in-app invitation; they join only when they accept, and the invitation
 * tells them if accepting moves them from another group.
 */
function AddByName({ groupId }: { groupId: number }) {
  const [term, setTerm] = useState("");
  const [people, setPeople] = useState<InviteCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<number>>(new Set());
  const [searching, startSearch] = useTransition();
  const [sending, startSend] = useTransition();
  const latest = useRef("");
  useEffect(() => {
    const value = term.trim();
    latest.current = value;
    if (value.length < 2) return;
    const id = window.setTimeout(() => startSearch(async () => {
      const result = await findGroupInvitees({ groupId, term: value });
      if (latest.current !== value) return;
      if (result.ok) { setPeople(result.people); setError(null); } else setError(result.error);
    }), 250);
    return () => window.clearTimeout(id);
  }, [term, groupId]);
  const shown = term.trim().length >= 2 ? people : null;
  const invite = (person: InviteCandidate) => startSend(async () => {
    setError(null);
    const result = await inviteToGroupByName({ groupId, enrollmentId: person.enrollmentId });
    if (!result.ok) { setError(result.error); return; }
    setSent(current => new Set(current).add(person.enrollmentId));
  });
  return <div className={styles.panel}>
    <div className="grid gap-2.5 p-3.5">
      <label className="grid gap-1.5 text-[13px] font-medium">Add by name
        <input type="search" value={term} onChange={event => setTerm(event.target.value)} placeholder="Search by name" autoComplete="off"
          className="h-10 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3 text-[16px] font-normal outline-none focus:border-(--color-community-blue)" />
      </label>
      {searching && !shown ? <span className={styles.rowMeta}>Searching…</span> : null}
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </div>
    {shown ? shown.length ? <ul className={styles.list}>{shown.map(person => {
      const done = sent.has(person.enrollmentId) || person.state === "invited";
      return <li key={person.enrollmentId} className={styles.row}>
        <Initials name={person.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{person.name}</span><span className={styles.rowMeta}>{done ? CANDIDATE_NOTE.invited : CANDIDATE_NOTE[person.state]}</span></span>
        {person.state === "in_this_group" || person.state === "full" ? null : <button type="button" className={`${styles.btn} ${styles.mini}`} data-primary={done ? undefined : ""} disabled={done || sending} onClick={() => invite(person)}>{done ? "Invited" : "Invite"}</button>}
      </li>;
    })}</ul> : <p className={`${styles.empty} m-0 border-t border-(--color-line) px-3.5 py-3`}>No one matches “{term.trim()}”.</p> : null}
  </div>;
}

export function InvitePanel({ group, leaderFirstName, empty, addByName = true }: {
  group: { id: number; name: string; inviteUrl: string };
  leaderFirstName: string;
  /** No disciples yet: also explain how joining works. */
  empty: boolean;
  /** Groups as oversight: add people by name as well as by link. */
  addByName?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const message = buildDiscipleshipShareMessage(leaderFirstName);
  const whatsapp = buildPreSogpShareIntentUrl({ platform: "whatsapp", postUrl: group.inviteUrl, message });
  const shortUrl = group.inviteUrl.replace(/^https?:\/\/(www\.)?/, "");

  return <>
    {addByName ? <AddByName groupId={group.id} /> : null}
    <div className={styles.panel}>
      <div className={styles.invite}>
        <div className={styles.inviteLink}>
          <span>{shortUrl}</span>
          <button type="button" className={`${styles.btn} ${styles.mini}`} onClick={() => {
            void navigator.clipboard?.writeText(group.inviteUrl).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            });
          }}>
            {copied ? <CheckIcon className="size-3.5" strokeWidth={2.2} /> : <CopyIcon className="size-3.5" strokeWidth={2} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <a className={styles.share} href={whatsapp} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
      </div>
    </div>
    {empty ? <>
      <div className={styles.sectionTitle}><h2>How it works</h2></div>
      <div className={styles.panel}>
        <ol className={styles.steps}>
          <li><b>1</b><span>{addByName ? "Add them by name or share the link" : "Share the link"}<small>{addByName ? "Anyone in Pleros, or someone you’re following up." : "With someone you're already following up."}</small></span></li>
          <li><b>2</b><span>They accept<small>Joining always needs their confirmation; new people enrol in SOGP first.</small></span></li>
          <li><b>3</b><span>Walk with them<small>See their progress, ask check-ins and pray together.</small></span></li>
        </ol>
      </div>
    </> : null}
  </>;
}

export function SharePhoneToggle({ id, label, initial, onChange }: {
  id: string;
  label: string;
  initial: boolean;
  onChange: (value: boolean) => Promise<DiscipleshipActionResult>;
}) {
  const [checked, setChecked] = useState(initial);
  const { pending, error, run } = useDiscipleshipAction(false);
  return <div className="grid gap-1">
    <label htmlFor={id} className={styles.toggle}>
      <input id={id} type="checkbox" checked={checked} disabled={pending} onChange={event => {
        const next = event.target.checked;
        setChecked(next);
        run(() => onChange(next), undefined, () => setChecked(!next));
      }} />
      {label}
    </label>
    {error ? <span role="alert" className={styles.error}>{error}</span> : null}
  </div>;
}
