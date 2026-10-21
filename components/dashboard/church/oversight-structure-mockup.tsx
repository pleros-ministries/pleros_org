"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, LayersIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";
import type { GroupOversightData } from "@/lib/db/queries/group-oversight";

import { GroupList, groupsOf } from "./group-oversight-view";
import { OversightHeader } from "./oversight-nav";

/**
 * Mockup (sample data, nothing saved) of the Structure tab after the
 * Pastor's 21 October feedback: no branches list, the people you lead who
 * lead groups (each with "Their groups"), and "Every other group" as one
 * panel opening its own page.
 */
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : word === "person" ? "people" : `${word}s`}`;
const shared = { mode: "structure" as const, day: "2026-10-21", remind: false, tab: "#" };

export function OversightStructureMockup({ data, page, role }: { data: GroupOversightData; page: "structure" | "other"; role: "pastor" | "branch_pastor" }) {
  const { own, other } = groupsOf(data);
  const otherTitle = role === "pastor" ? "Every other group" : "Other groups in your branches";
  const otherPeople = other.reduce((n, group) => n + group.members.length, 0);
  const query = (next: string) => `?page=${next}&role=${role}`;

  if (page === "other") return <div className={styles.page}>
    <Crumbs back={query("structure")} trail={["Oversight", otherTitle]} />
    <div><h1>{otherTitle}</h1><p className={styles.sub}>{plural(other.length, "group")} · {plural(otherPeople, "person")} · by leader</p></div>
    <GroupList groups={other} {...shared} />
    <p className={styles.note}>Open a group to see its members. “Their groups” shows the groups that person leads.</p>
  </div>;

  // Members of the groups you lead who lead groups of their own.
  const leaders = data.people.filter(person => person.depth === 1 && person.leadsMembers > 0);
  return <div className={styles.page}>
    <Crumbs trail={["Community", "Oversight"]} />
    <OversightHeader sub={`${data.scopeLabel} · ${plural(data.people.length, "person")}`} updates={3} />

    <div className={styles.sectionTitle}><h2>Groups you lead</h2><span className={styles.rowMeta}>{plural(own.length, "group")}</span></div>
    <GroupList groups={own} openFirst {...shared} />

    {leaders.length ? <>
      <div className={styles.sectionTitle}><h2>Your members who lead</h2><span className={styles.rowMeta}>{plural(leaders.length, "person")}</span></div>
      <div className={styles.panel}><ul className={styles.list}>
        {leaders.map(person => <li key={person.userId}><div className={styles.row}>
          <Initials name={person.name} />
          <Link href="#" className={`${styles.rowCopy} text-inherit no-underline`}>
            <span className={styles.rowTitle}>{person.name}</span>
            <span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>Leads {plural(person.leadsMembers, "person")} · in {person.groupName}</span>
          </Link>
          <Link href="#" className={`${styles.btn} ${styles.mini}`} aria-label={`Open ${person.name}’s groups`}>Their groups<ChevronRightIcon className="-mr-1 size-3.5" strokeWidth={2.2} aria-hidden /></Link>
        </div></li>)}
      </ul></div>
    </> : null}

    {other.length ? <>
      <div className={styles.sectionTitle}><h2>{role === "pastor" ? "Across the church" : "Across your branches"}</h2></div>
      <div className={styles.panel}>
        <Link href={query("other")} className={styles.row}>
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]" aria-hidden><LayersIcon className="size-[18px]" strokeWidth={2} /></span>
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{otherTitle}</span><span className={styles.rowMeta}>{plural(other.length, "group")} · {plural(otherPeople, "person")}</span></span>
          <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
        </Link>
      </div>
    </> : null}

    <p className={styles.note}>Open a group to see its members. “Their groups” shows the groups that person leads.</p>
    {role === "pastor" ? <Link href="#" className={`${styles.quiet} -mt-1 ml-0.5`}>Branch setup</Link> : null}
  </div>;
}

/** Stand-in for the shell's breadcrumb bar, which previews don't render. */
function Crumbs({ trail, back = "#" }: { trail: string[]; back?: string }) {
  return <nav aria-label="Breadcrumb" className="-mx-4 -mt-[18px] mb-1 flex h-10 items-center gap-1.5 border-b border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-4 text-[12.5px] text-(--color-community-muted)">
    <Link href={back} aria-label="Back" className="-ml-1 grid size-7 place-items-center"><ChevronLeftIcon className="size-4" strokeWidth={2} /></Link>
    {trail.map((crumb, index) => <span key={crumb} className="flex min-w-0 items-center gap-1.5">
      {index ? <ChevronRightIcon className="size-3 shrink-0" strokeWidth={2} /> : null}
      <span className={index === trail.length - 1 ? "truncate font-medium text-(--color-community-ink)" : undefined}>{crumb}</span>
    </span>)}
  </nav>;
}
