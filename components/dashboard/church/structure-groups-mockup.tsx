import Link from "next/link";
import { ChevronRightIcon, LayersIcon, UsersRoundIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";

/**
 * Mockup (sample data, nothing saved): Oversight Structure as groups, not
 * people (Pastor, 22 October: "we are not dealing with people, except in
 * reports; we are dealing with the groups and the structure"). Each group
 * names its leader, and opening it shows its members and the groups under it.
 */

type Group = { id: number; name: string; leader: string; members: number; reported: number };
const MINE: Group[] = [
  { id: 1, name: "Sunday workers", leader: "You", members: 3, reported: 2 },
  { id: 2, name: "Elders", leader: "You", members: 2, reported: 2 },
];
const UNDER: Group[] = [
  { id: 3, name: "Hall C Bible study", leader: "Tolu Adebayo", members: 2, reported: 1 },
  { id: 4, name: "Grace’s evening group", leader: "Grace Eze", members: 2, reported: 2 },
  { id: 9, name: "Amaka’s prayer cell", leader: "Amaka Obi", members: 3, reported: 2 },
];
const TONES = [["#e4ebfd", "#2331ae"], ["#f6ecd9", "#5a3d0c"], ["#f6d9de", "#7a2e45"], ["#e6dbfb", "#3e1876"]] as const;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Rate({ group }: { group: Group }) {
  const all = group.reported >= group.members;
  return <span className="grid shrink-0 justify-items-end text-[12px] leading-4">
    <b className="font-medium tabular-nums" style={{ color: all ? "var(--color-community-ink)" : "#a15c12" }}>{group.reported} of {group.members}</b>
    <span className="text-(--color-community-muted)">reported</span>
  </span>;
}

function GroupRow({ group, index, href }: { group: Group; index: number; href: string }) {
  const [bg, ink] = TONES[index % TONES.length]!;
  return <li><Link href={href} className={styles.row}>
    <span className="grid size-10 shrink-0 place-items-center rounded-[10px]" style={{ background: bg, color: ink }} aria-hidden="true"><UsersRoundIcon className="size-[18px]" strokeWidth={2} /></span>
    <span className={`${styles.rowCopy} gap-0.5`}>
      <span className={styles.rowTitle} style={{ whiteSpace: "normal" }}>{group.name}</span>
      <span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>{group.leader === "You" ? plural(group.members, "member") : `Led by ${group.leader} · ${plural(group.members, "member")}`}</span>
    </span>
    <Rate group={group} />
    <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
  </Link></li>;
}

function Tabs() {
  return <div className="grid grid-cols-3 gap-0 rounded-[10px] bg-[#eceef2] p-[3px] text-[13px] font-medium" aria-hidden="true">
    <span className="grid h-8 place-items-center rounded-[8px] bg-white shadow-[0_1px_2px_rgb(0_0_0/8%)]">Structure</span>
    <span className="grid h-8 place-items-center text-(--color-community-muted)">Reports</span>
    <span className="grid h-8 place-items-center text-(--color-community-muted)">Updates</span>
  </div>;
}

export function StructureGroupsMockup({ screen }: { screen: "structure" | "group" }) {
  if (screen === "group") return <div className="grid gap-3.5">
    <div className={styles.heading}><div><h1>Hall C Bible study</h1><p className={styles.sub}>Led by Tolu Adebayo · 2 members · 1 of 2 reported</p></div></div>
    <div className={styles.sectionTitle}><h2>Members</h2></div>
    <div className={styles.panel}><ul className={styles.list}>
      {[{ name: "Chidi Okafor", note: "Ministry missing", warn: true }, { name: "Ifeoma Nwosu", note: "All in", warn: false }].map(person => <li key={person.name}><Link href="#" className={styles.row}>
        <Initials name={person.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{person.name}</span><span className={styles.rowMeta} style={{ color: person.warn ? "#a15c12" : "var(--color-community-green-ink)" }}>{person.note}</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></li>)}
    </ul></div>
    <div className={styles.sectionTitle}><h2>Groups under it</h2><span className={styles.rowMeta}>1 group</span></div>
    <div className={styles.panel}><ul className={styles.list}>
      <GroupRow group={{ id: 10, name: "Chidi’s home cell", leader: "Chidi Okafor", members: 4, reported: 3 }} index={3} href="#" />
    </ul></div>
    <p className={styles.note}>A member opens their report. A group under it opens the same way, one level at a time.</p>
  </div>;

  return <div className="grid gap-3.5">
    <div className={styles.heading}><div><h1>Oversight</h1><p className={styles.sub}>The whole church · 5 groups under you</p></div></div>
    <Tabs />

    <div className={styles.sectionTitle}><h2>Groups you lead</h2><span className={styles.rowMeta}>{plural(MINE.length, "group")}</span></div>
    <div className={styles.panel}><ul className={styles.list}>{MINE.map((group, index) => <GroupRow key={group.id} group={group} index={index} href="#" />)}</ul></div>

    {/* The groups your members lead, each named with its leader: groups, not people. */}
    <div className={styles.sectionTitle}><h2>Groups under you</h2><span className={styles.rowMeta}>{plural(UNDER.length, "group")}</span></div>
    <div className={styles.panel}><ul className={styles.list}>{UNDER.map((group, index) => <GroupRow key={group.id} group={group} index={index + 2} href="?screen=group" />)}</ul></div>

    <div className={styles.sectionTitle}><h2>Across the church</h2></div>
    <div className={styles.panel}><Link href="#" className={styles.row}>
      <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]" aria-hidden="true"><LayersIcon className="size-[18px]" strokeWidth={2} /></span>
      <span className={styles.rowCopy}><span className={styles.rowTitle}>Every other group</span><span className={styles.rowMeta}>4 groups · 10 people</span></span>
      <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
    </Link></div>
    <p className={styles.note}>Open a group for its members and the groups under it. People’s own reports are on Reports.</p>
  </div>;
}
