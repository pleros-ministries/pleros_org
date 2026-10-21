"use client";

import Link from "next/link";
import { BellIcon, ChevronLeftIcon, ChevronRightIcon, LayersIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";
import type { GroupOversightData, GroupOversightPerson } from "@/lib/db/queries/group-oversight";

import { GroupList, ReportLine, groupsOf } from "./group-oversight-view";
import { OversightHeader } from "./oversight-nav";

/**
 * Mockup (sample data, nothing saved) of the Reports tab to match the new
 * Structure: no groups to open, just your members' reports for the day,
 * missing first; leaders carry "Their groups"; every other group is one
 * panel opening its own page.
 */
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : word === "person" ? "people" : `${word}s`}`;
const reported = (person: GroupOversightPerson) => Object.values(person.statuses ?? {}).some(status => status !== "missing");
const DAYS = ["Today", "Yesterday", "Mon 19", "Sun 18", "Sat 17"];

export function OversightReportsMockup({ data, page, role }: { data: GroupOversightData; page: "reports" | "other"; role: "pastor" | "branch_pastor" }) {
  const { other } = groupsOf(data);
  const otherTitle = role === "pastor" ? "Every other group" : "Other groups in your branches";
  const otherPeople = other.flatMap(group => group.members);
  const query = (next: string) => `?page=${next === "other" ? "reports-other" : "reports"}&role=${role}`;

  if (page === "other") return <div className={styles.page}>
    <Crumbs back={query("reports")} trail={["Reports", otherTitle]} />
    <div><h1>{otherTitle}</h1><p className={styles.sub}>Today · {otherPeople.filter(reported).length} of {plural(otherPeople.length, "person")} reported</p></div>
    <Days />
    <GroupList groups={other} mode="reports" day={data.day} remind={false} tab="#" />
    <p className={styles.note}>Open a group for each member’s report.</p>
  </div>;

  // Your members, the ones still to report first.
  const members = data.people.filter(person => person.depth === 1).sort((a, b) => Number(reported(a)) - Number(reported(b)) || a.name.localeCompare(b.name));
  const missing = members.filter(person => !reported(person)).length;
  return <div className={styles.page}>
    <Crumbs trail={["Community", "Oversight"]} />
    <OversightHeader sub={`${data.scopeLabel} · ${plural(data.people.length, "person")}`} updates={3} />
    <Days />
    <div className={styles.strip}>
      <div><span>Reported</span><strong>{members.length - missing}/{members.length}</strong></div>
      <div><span>Need a report</span><strong style={{ color: missing ? "#92400e" : undefined }}>{missing}</strong></div>
      <div><span>Your groups</span><strong>{data.groups.length}</strong></div>
    </div>

    <div className={styles.sectionTitle}><h2>Your members</h2><span className={styles.rowMeta}>{plural(members.length, "person")}</span></div>
    <div className={styles.panel}><ul className={styles.list}>
      {members.map(person => <li key={person.userId}><div className={styles.row}>
        <Initials name={person.name} />
        <Link href="#" className={`${styles.rowCopy} gap-1 text-inherit no-underline`}>
          <span className={styles.rowTitle}>{person.name}</span>
          <ReportLine person={person} />
        </Link>
        {person.leadsMembers
          ? <Link href="#" className={`${styles.btn} ${styles.mini}`} aria-label={`Open ${person.name}’s groups`}>Their groups<ChevronRightIcon className="-mr-1 size-3.5" strokeWidth={2.2} aria-hidden /></Link>
          : !reported(person) ? <button type="button" className={`${styles.quiet} inline-flex shrink-0 items-center gap-1`}><BellIcon className="size-3.5" strokeWidth={2.2} aria-hidden />Remind</button> : null}
      </div></li>)}
    </ul></div>

    {other.length ? <>
      <div className={styles.sectionTitle}><h2>{role === "pastor" ? "Across the church" : "Across your branches"}</h2></div>
      <div className={styles.panel}>
        <Link href={query("other")} className={styles.row}>
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]" aria-hidden><LayersIcon className="size-[18px]" strokeWidth={2} /></span>
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{otherTitle}</span><span className={styles.rowMeta}>{plural(other.length, "group")} · {plural(otherPeople.length, "person")}</span></span>
          <span className="shrink-0 text-right text-[12px] leading-4" style={{ color: otherPeople.every(reported) ? "var(--color-community-muted)" : "#a15c12" }}>{otherPeople.filter(reported).length} of {otherPeople.length}<br /><span className="text-[var(--color-community-muted)]">reported</span></span>
          <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
        </Link>
      </div>
    </> : null}
    <p className={styles.note}>Tap someone for their full report. “Their groups” shows the reports of the people they lead.</p>
  </div>;
}

function Days() {
  return <div className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Report day">
    {DAYS.map((day, index) => <span key={day} className={`${styles.btn} ${styles.mini} shrink-0`} data-primary={index === 0 ? "" : undefined}>{day}</span>)}
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
