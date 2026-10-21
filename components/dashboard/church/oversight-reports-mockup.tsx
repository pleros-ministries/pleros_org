"use client";

import Link from "next/link";
import { BellIcon, ChevronLeftIcon, ChevronRightIcon, LayersIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";
import { groupIcon } from "@/components/community/groups/group-hero";
import type { GroupOversightData, GroupOversightPerson } from "@/lib/db/queries/group-oversight";

import { GroupList, ReportLine, groupsOf } from "./group-oversight-view";
import { OversightHeader } from "./oversight-nav";

/**
 * Mockup (sample data, nothing saved) of two ways to redo Oversight's
 * Reports tab:
 * - A: no groups; your members' reports for the day in one list.
 * - B: mirrors Structure; Groups you lead as rows (each opening that group's
 *   reports as a page of its own), then Groups led by your members.
 * Both end with Every other group as one panel.
 */
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : word === "person" ? "people" : `${word}s`}`;
const reported = (person: GroupOversightPerson) => Object.values(person.statuses ?? {}).some(status => status !== "missing");
const missingFirst = (a: GroupOversightPerson, b: GroupOversightPerson) => Number(reported(a)) - Number(reported(b)) || a.name.localeCompare(b.name);
const DAYS = ["Today", "Yesterday", "Mon 19", "Sun 18", "Sat 17"];

export type ReportsMockupPage = "reports" | "other" | "group";

export function OversightReportsMockup({ data, option, page, role, groupId }: { data: GroupOversightData; option: "a" | "b"; page: ReportsMockupPage; role: "pastor" | "branch_pastor"; groupId?: number }) {
  const { own, other } = groupsOf(data);
  const otherTitle = role === "pastor" ? "Every other group" : "Other groups in your branches";
  const otherPeople = other.flatMap(group => group.members);
  const href = (next: ReportsMockupPage, extra = "") => `?option=${option}&page=${next}&role=${role}${extra}`;

  // B only: one group's reports for the day, as a page of its own.
  if (page === "group") {
    const group = own.find(candidate => candidate.id === groupId) ?? own[0]!;
    const members = [...group.members].sort(missingFirst);
    return <div className={styles.page}>
      <Crumbs back={href("reports")} trail={["Reports", group.name]} />
      <div><h1>{group.name}</h1><p className={styles.sub}>Today · {members.filter(reported).length} of {plural(members.length, "member")} reported</p></div>
      <Days />
      <PeopleReports people={members} />
      <p className={styles.note}>Tap someone for their full report.</p>
    </div>;
  }

  if (page === "other") return <div className={styles.page}>
    <Crumbs back={href("reports")} trail={["Reports", otherTitle]} />
    <div><h1>{otherTitle}</h1><p className={styles.sub}>Today · {otherPeople.filter(reported).length} of {plural(otherPeople.length, "person")} reported</p></div>
    <Days />
    <GroupList groups={other} mode="reports" day={data.day} remind={false} tab="#" />
    <p className={styles.note}>Open a group for each member’s report.</p>
  </div>;

  const mine = own.flatMap(group => group.members);
  const missing = mine.filter(person => !reported(person)).length;
  const leaders = data.people.filter(person => person.depth === 1 && person.leadsMembers > 0);
  return <div className={styles.page}>
    <Crumbs trail={["Community", "Oversight"]} />
    <OversightHeader sub={`${data.scopeLabel} · ${plural(data.people.length, "person")}`} updates={3} />
    <Days />
    <div className={styles.strip}>
      <div><span>Reported</span><strong>{mine.length - missing}/{mine.length}</strong></div>
      <div><span>Need a report</span><strong style={{ color: missing ? "#92400e" : undefined }}>{missing}</strong></div>
      <div><span>Your groups</span><strong>{own.length}</strong></div>
    </div>

    {option === "a" ? <>
      <div className={styles.sectionTitle}><h2>Your members</h2><span className={styles.rowMeta}>{plural(mine.length, "person")}</span></div>
      <PeopleReports people={[...mine].sort(missingFirst)} theirGroups />
    </> : <>
      <div className={styles.sectionTitle}><h2>Groups you lead</h2><span className={styles.rowMeta}>{plural(own.length, "group")}</span></div>
      <div className={styles.panel}><ul className={styles.list}>
        {own.map((group, index) => <li key={group.id}><Link href={href("group", `&group=${group.id}`)} className={styles.row}>
          <span className="size-10 shrink-0 rounded-[10px] bg-cover bg-center" style={{ backgroundColor: index % 2 ? "#e6ecfc" : "#e3d8f8", ...groupIcon(index % 2 ? "leading-slate" : "leading") }} aria-hidden />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{group.name}</span><span className={styles.rowMeta}>{plural(group.members.length, "member")}</span></span>
          <Rate people={group.members} />
          <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
        </Link></li>)}
      </ul></div>
      {leaders.length ? <>
        <div className={styles.sectionTitle}><h2>Groups led by your members</h2><span className={styles.rowMeta}>{plural(leaders.length, "person")}</span></div>
        <div className={styles.panel}><ul className={styles.list}>
          {leaders.map(person => {
            const people = data.people.filter(candidate => candidate.overseerId === person.userId);
            const done = people.filter(reported).length;
            return <li key={person.userId}><div className={styles.row}>
              <Initials name={person.name} />
              <span className={styles.rowCopy}>
                <span className={styles.rowTitle}>{person.name}</span>
                <span className={styles.rowMeta} style={{ color: done === people.length ? undefined : "#a15c12" }}>{done} of {plural(people.length, "person")} reported</span>
              </span>
              <TheirGroups name={person.name} />
            </div></li>;
          })}
        </ul></div>
      </> : null}
    </>}

    {other.length ? <>
      <div className={styles.sectionTitle}><h2>{role === "pastor" ? "Across the church" : "Across your branches"}</h2></div>
      <div className={styles.panel}>
        <Link href={href("other")} className={styles.row}>
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]" aria-hidden><LayersIcon className="size-[18px]" strokeWidth={2} /></span>
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{otherTitle}</span><span className={styles.rowMeta}>{plural(other.length, "group")} · {plural(otherPeople.length, "person")}</span></span>
          <Rate people={otherPeople} />
          <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
        </Link>
      </div>
    </> : null}
    <p className={styles.note}>{option === "a" ? "Tap someone for their full report." : "Open a group for each member’s report."} “Their groups” shows the reports of the people that person leads.</p>
  </div>;
}

/** People with the day's report in a few words; leaders get Their groups, the unreported get Remind. */
function PeopleReports({ people, theirGroups = false }: { people: GroupOversightPerson[]; theirGroups?: boolean }) {
  return <div className={styles.panel}><ul className={styles.list}>
    {people.map(person => <li key={person.userId}><div className={styles.row}>
      <Initials name={person.name} />
      <Link href="#" className={`${styles.rowCopy} gap-1 text-inherit no-underline`}>
        <span className={styles.rowTitle}>{person.name}</span>
        <ReportLine person={person} />
      </Link>
      {theirGroups && person.leadsMembers ? <TheirGroups name={person.name} />
        : !reported(person) ? <button type="button" className={`${styles.quiet} inline-flex shrink-0 items-center gap-1`}><BellIcon className="size-3.5" strokeWidth={2.2} aria-hidden />Remind</button> : null}
    </div></li>)}
  </ul></div>;
}

function TheirGroups({ name }: { name: string }) {
  return <Link href="#" className={`${styles.btn} ${styles.mini}`} aria-label={`Open ${name}’s groups`}>Their groups<ChevronRightIcon className="-mr-1 size-3.5" strokeWidth={2.2} aria-hidden /></Link>;
}

function Rate({ people }: { people: GroupOversightPerson[] }) {
  const done = people.filter(reported).length;
  return <span className="shrink-0 text-right text-[12px] leading-4" style={{ color: done === people.length ? "var(--color-community-muted)" : "#a15c12" }}>
    {done} of {people.length}<br /><span className="text-[var(--color-community-muted)]">reported</span>
  </span>;
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
