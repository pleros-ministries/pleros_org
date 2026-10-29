"use client";

import { useState } from "react";
import { ChevronDownIcon, LogOutIcon, UsersRoundIcon } from "lucide-react";

import { ReportSheet, sheetStyles as sheet } from "@/components/community/report/report-sheet";

import { ActionMenu } from "./action-menu";
import { GroupCard } from "./community-home-cards";
import homeStyles from "./community-home-v3.module.css";
import styles from "./discipleship/discipleship-group.module.css";
import { Initials } from "./discipleship/shared";
import { GroupHero, GroupTabs } from "./groups/group-hero";

/**
 * Mockup (sample data, nothing saved): multi-group membership (user, 29
 * October). A person can be in up to five groups and every leader oversees
 * them; accepting an invite adds the group and keeps the others; leaving is
 * its own action; a question after a teaching goes to the leader they choose.
 */

export type MultiGroupScreen = "invite" | "home" | "group" | "question" | "oversight";

export function MultiGroupMockup({ screen }: { screen: MultiGroupScreen }) {
  const [tab, setTab] = useState<"discussion" | "members">("discussion");
  const [leader, setLeader] = useState("Sample Ade");
  const [open, setOpen] = useState(true);

  if (screen === "invite") return <div className="grid gap-3.5 px-4 pt-4 pb-10">
    <div><h1>Join Sample Unit B?</h1><p className={styles.sub}>Sample Bisi invited you</p></div>
    <div className={`${styles.panel} grid gap-3 p-4`}>
      <span className="flex items-center gap-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]" aria-hidden="true"><UsersRoundIcon className="size-[18px]" strokeWidth={2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Sample Unit B</span><span className={styles.rowMeta}>Led by Sample Bisi · 6 members</span></span>
      </span>
      {/* No more "This moves you": joining adds the group. */}
      <p className="m-0 text-[13px] leading-5 text-(--color-text-muted)">You’ll stay in Sample leaders’ group too. Sample Bisi will look after you in this group, alongside Sample Ade.</p>
      <div className="flex gap-2">
        <button type="button" className={`${styles.btn} h-[38px] flex-1 text-[13.5px]`} data-primary="">Join as well</button>
        <button type="button" className={`${styles.btn} h-[38px] text-[13.5px]`}>Not now</button>
      </div>
    </div>
    <p className={styles.note}>You can be in up to five groups. Leave any of them from the group’s page.</p>
  </div>;

  if (screen === "home") return <div className={homeStyles.home}>
    <header className={homeStyles.heading}><h1>Your Pleros Community</h1></header>
    <section className={homeStyles.block}>
      <div className={homeStyles.blockHeading}><h2>Groups you’re under</h2><span className="text-[12.5px] text-(--color-text-muted)">2 groups</span></div>
      <div className={homeStyles.groupGrid}>
        <GroupCard href="?screen=group" art="discipleship" tag="Your group" title="Sample leaders’ group" meta="Led by Sample Ade" />
        <GroupCard href="?screen=group" art="discipleship" tag="Your group" title="Sample Unit B" meta="Led by Sample Bisi" />
      </div>
    </section>
  </div>;

  if (screen === "group") return <div className="grid gap-4 px-4 pt-4 pb-10">
    <GroupHero art="discipleship" tag="Your group" title="Sample Unit B" meta="Led by Sample Bisi · 6 members"
      actions={<ActionMenu label="Group options" className="!size-8 !rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white" actions={[
        { key: "leave", label: "Leave this group", icon: LogOutIcon, danger: true, onSelect: () => window.confirm("Leave Sample Unit B? Sample Bisi won’t look after you in it any more. You stay in your other groups.") },
      ]} />} />
    <GroupTabs tabs={[{ key: "discussion", label: "Discussion" }, { key: "members", label: "Members", count: 6 }]} value={tab} onChange={setTab} />
    <p className={`${styles.panel} ${styles.empty}`}>The group’s {tab}, as now.</p>
    <p className={styles.note}>Leave from the ··· menu. Your other groups don’t change.</p>
  </div>;

  if (screen === "question") return <div className="px-4 pt-4">
    <ReportSheet title="Do you have a question?" subtitle="About The Place of the Gospel" onClose={() => undefined}
      footer={() => <><button type="button" className={sheet.quiet}>Not now</button><button type="button" className={`${sheet.primary} ${sheet.fit}`}>Send to {leader.split(" ")[1] ?? leader}</button></>}>
      {() => <>
        <div className={sheet.field}><span className={sheet.label}>Ask</span>
          <div className={sheet.chips} role="group" aria-label="Which leader">
            {["Sample Ade", "Sample Bisi"].map(name => <button key={name} type="button" className={sheet.chip} aria-pressed={leader === name} onClick={() => setLeader(name)}>{name}</button>)}
          </div>
        </div>
        <label className={sheet.field}><span className={sheet.label}>Your question</span><textarea className={sheet.textarea} rows={3} placeholder="What would you like to ask about this teaching?" /></label>
        <p className={sheet.hint}>Only you and {leader.split(" ")[1] ?? leader} see it.</p>
      </>}
    </ReportSheet>
  </div>;

  // Oversight: the same person under two leaders, counted once.
  return <div className="grid gap-3.5 px-4 pt-4 pb-10">
    <div><h1>Oversight</h1><p className={styles.sub}>The whole church · 11 people</p></div>
    <div className={styles.sectionTitle}><h2>Groups your members lead</h2><span className={styles.rowMeta}>2 leaders · 2 groups</span></div>
    <div className={styles.panel}><ul className={styles.list}>
      {[{ leader: "Sample Ade", group: "Sample leaders’ group", members: ["Sample Chidi", "Sample Dayo"] }, { leader: "Sample Bisi", group: "Sample Unit B", members: ["Sample Chidi", "Sample Efe"] }].map((row, index) => <li key={row.leader}>
        <button type="button" className={`${styles.row} w-full text-left`} aria-expanded={open || index > 0} onClick={() => setOpen(value => !value)}>
          <Initials name={row.leader} />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{row.leader}</span><span className={styles.rowMeta}>Leads 1 group · {row.members.length} members</span></span>
          <ChevronDownIcon className={`${styles.chev} size-4 rotate-180`} strokeWidth={2} />
        </button>
        <ul className={styles.list} style={{ borderTop: "1px solid var(--color-line, #e7e9ec)" }}>
          {row.members.map(name => <li key={name} className={styles.row} style={{ paddingLeft: 30 }}>
            <Initials name={name} />
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{name}</span><span className={styles.rowMeta}>{name === "Sample Chidi" ? `Also in ${index ? "Sample leaders’ group" : "Sample Unit B"}` : row.group}</span></span>
          </li>)}
        </ul>
      </li>)}
    </ul></div>
    <p className={styles.note}>Someone in two groups shows under both leaders, marked “Also in”, and counts once in totals and report rates.</p>
  </div>;
}
