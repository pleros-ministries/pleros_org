"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import type { DiscipleshipActionResult } from "@/app/(site)/dashboard/sogp/discipleship/_actions";
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
  return <div className={styles.strip} aria-label="How your disciples are doing">
    <div><strong>{counts.ok}</strong><span><Dot tone="ok" />On track</span></div>
    <div><strong>{counts.risk}</strong><span><Dot tone="risk" />At risk</span></div>
    <div><strong>{counts.off}</strong><span><Dot tone="off" />Not active</span></div>
  </div>;
}

/** The group's own invite link: copy, share on WhatsApp, the leader's number consent and a fresh link. */
export function InvitePanel({ group, leaderFirstName, empty }: {
  group: { id: number; name: string; inviteUrl: string };
  leaderFirstName: string;
  /** No disciples yet: also explain how joining works. */
  empty: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const message = buildDiscipleshipShareMessage(leaderFirstName);
  const whatsapp = buildPreSogpShareIntentUrl({ platform: "whatsapp", postUrl: group.inviteUrl, message });
  const shortUrl = group.inviteUrl.replace(/^https?:\/\/(www\.)?/, "");

  return <>
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
          <li><b>1</b><span>Share the link<small>With someone you&apos;re already following up.</small></span></li>
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
