"use client";

import { useState } from "react";
import { ChevronRightIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";

/**
 * Mockup (sample data, nothing saved): pending invites on a group page (user,
 * 22 October: "I need to be able to see pending invites"). People invited by
 * name who haven't accepted sit under the members, with when they were invited
 * and a Withdraw. Link invites aren't per person, so they can't be listed.
 */

const MEMBERS = [
  { name: "Sample Member A", meta: "Last active 11 Oct", status: "Not active", tone: "red" },
  { name: "Sample Member B", meta: "quiz avg 100% · Prayer Watch 96%", status: "Slowing down", tone: "amber" },
  { name: "Sample Member C", meta: "quiz avg 100% · Prayer Watch 100%", status: "On track", tone: "blue" },
];
const INVITED = [
  { id: 1, name: "Sample Invitee D", when: "Invited 2 days ago" },
  { id: 2, name: "Sample Invitee E", when: "Invited 20 Oct" },
];

export function PendingInvitesMockup() {
  const [invited, setInvited] = useState(INVITED);
  const [confirm, setConfirm] = useState<number | null>(null);

  return <div className="grid gap-3.5">
    <div className={styles.heading}><div><h1>Sample group</h1><p className={styles.sub}>3 members · {invited.length ? `${invited.length} invited` : "no invites waiting"}</p></div></div>

    <div className={styles.sectionTitle}><h2>Members</h2><span className="text-[12.5px] text-(--color-community-muted)">3</span></div>
    <div className={styles.panel}><ul className={styles.list}>
      {MEMBERS.map(member => <li key={member.name}><a href="#" className={styles.row}>
        <Initials name={member.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{member.name}</span><span className={styles.rowMeta}>{member.meta}</span></span>
        <span className="shrink-0 text-[12px]" style={{ color: member.tone === "red" ? "#b42318" : member.tone === "amber" ? "#a15c12" : "var(--color-community-blue)" }}>{member.status}</span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </a></li>)}
    </ul></div>

    {/* Invited by name and not joined yet: who, when, and Withdraw. */}
    <div className={styles.sectionTitle}><h2>Invited, not joined yet</h2><span className="text-[12.5px] text-(--color-community-muted) tabular-nums">{invited.length || null}</span></div>
    <div className={styles.panel}>
      {invited.length ? <ul className={styles.list}>
        {invited.map(invite => <li key={invite.id} className={`${styles.row} items-center`}>
          <Initials name={invite.name} />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{invite.name}</span><span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>{invite.when}</span></span>
          {confirm === invite.id
            ? <span className="flex shrink-0 items-center gap-2">
              <button type="button" className={styles.quiet} onClick={() => setConfirm(null)}>Keep</button>
              <button type="button" className={styles.btn} onClick={() => { setInvited(list => list.filter(item => item.id !== invite.id)); setConfirm(null); }}>Withdraw</button>
            </span>
            : <button type="button" className={`${styles.btn} shrink-0`} onClick={() => setConfirm(invite.id)}>Withdraw</button>}
        </li>)}
      </ul> : <p className={styles.empty}>No invites waiting. People you invite by name show here until they accept.</p>}
    </div>
    <p className={styles.note}>Only invites sent by name show here. Anyone with your group link joins without an invite, so there’s nothing to list for it.</p>
  </div>;
}
