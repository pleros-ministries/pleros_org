"use client";

import Link from "next/link";
import { BellOffIcon, ChevronRightIcon, LockIcon, MessageCircleQuestionIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";
import { groupIcon } from "@/components/community/groups/group-hero";
import { MessageButton } from "@/components/community/messages/message-button";
import type { GroupOversightData, GroupOversightPerson } from "@/lib/db/queries/group-oversight";

import { OversightHeader } from "./oversight-nav";
import { Mark, short } from "./oversight-view";

export const OVERSIGHT_PATH = "/dashboard/community/oversight";
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : word === "person" ? "people" : word.endsWith("person") ? `${word.slice(0, -6)}people` : `${word}s`}`;
const reportHref = (userId: string) => `/dashboard/church/${encodeURIComponent(userId)}`;
const underHref = (userId: string) => `${OVERSIGHT_PATH}?under=${encodeURIComponent(userId)}`;

function Rate({ done, total }: { done: number; total: number }) {
  if (!total) return <span className={styles.rowMeta}>No one yet</span>;
  return <span className="grid shrink-0 justify-items-end gap-1">
    <span className={styles.meter} aria-hidden="true"><i style={{ width: `${Math.round((done / total) * 100)}%` }} /></span>
    <span className={styles.rowMeta}>{done}/{total} today</span>
  </span>;
}

/** Where someone sits: their group and, in the wider views, who leads it. */
function placeOf(person: GroupOversightPerson, focusLeads: boolean) {
  if (!person.groupName) return person.leadsMembers ? "Group leader" : null;
  return person.depth === 1 && focusLeads ? person.groupName : `${person.overseerName ? `${person.overseerName.split(" ")[0]}’s` : "In"} ${person.groupName}`;
}

function PersonRow({ person, focusLeads }: { person: GroupOversightPerson; focusLeads: boolean }) {
  const meta = [
    placeOf(person, focusLeads),
    person.leadsMembers ? `leads ${plural(person.leadsMembers, "person")}` : null,
    person.silentDays >= 3 ? `no report in ${person.silentDays} days` : null,
  ].filter(Boolean).join(" · ");
  return <li><div className={styles.row}>
    <Initials name={person.name} />
    <Link href={reportHref(person.userId)} className={`${styles.rowCopy} text-inherit no-underline`}>
      <span className={styles.rowTitle}>{person.name}</span>
      <span className={styles.rowMeta}>{meta || "Member"}</span>
    </Link>
    {person.leadsMembers
      ? <Link href={underHref(person.userId)} className={styles.btn} aria-label={`Open ${person.name}’s groups`}>Their groups<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link>
      : <span className={styles.pill} data-tone={person.reportedToday ? "ok" : person.silentDays >= 3 ? "off" : "risk"}>{person.reportedToday ? "Reported" : "Not yet"}</span>}
  </div></li>;
}

/**
 * Oversight on groups (Pastor, 19 October): today's reports, one "needs you"
 * list, the focus person's groups, the people under them, and branches for
 * the Pastor and branch pastors.
 */
export function GroupOversightOverview({ data }: { data: GroupOversightData }) {
  const { totals } = data;
  const share = totals.people ? Math.round((totals.reportedToday / totals.people) * 100) : 0;
  const pending = data.people.filter(person => !person.reportedToday).sort((a, b) => b.silentDays - a.silentDays);
  const direct = data.people.filter(person => person.depth === 1);
  const focusLeads = data.groups.length > 0;
  const attention = [
    totals.waiting ? { key: "questions", href: `${OVERSIGHT_PATH}/questions${data.under ? `?under=${encodeURIComponent(data.under.userId)}` : ""}`, tone: ["#fde3cf", "#7a3a10"], icon: <MessageCircleQuestionIcon className="size-4" strokeWidth={2.2} />, title: `${plural(totals.waiting, "question")} waiting over 3 days`, meta: data.waiting.slice(0, 3).map(row => row.name).join(", ") } : null,
    totals.silent ? { key: "silent", href: `${OVERSIGHT_PATH}/reports${data.under ? `?under=${encodeURIComponent(data.under.userId)}` : ""}`, tone: ["#f6dcdc", "#9b2c2c"], icon: <BellOffIcon className="size-4" strokeWidth={2.2} />, title: `${plural(totals.silent, "person")} haven’t reported in 3 days`, meta: pending.filter(person => person.silentDays >= 3).slice(0, 3).map(person => person.name).join(", ") } : null,
  ].filter(Boolean) as Array<{ key: string; href: string; tone: string[]; icon: React.ReactNode; title: string; meta: string }>;
  const stats: Array<[string, number]> = [["At risk", totals.atRisk], ["Questions", totals.waiting], ["Silent 3+ days", totals.silent]];

  return <div className={styles.page}>
    <OversightHeader title={data.under ? data.under.name : "Oversight"} structure={data.role === "pastor" && !data.under}
      sub={`${data.scopeLabel} · ${plural(totals.people, "person")}`} />
    {data.under ? <Link href={OVERSIGHT_PATH} className={`${styles.quiet} -mt-1`}>Back to your oversight</Link> : null}

    <section className={styles.panel} aria-label="Today">
      <div className="grid gap-2.5 p-3.5">
        <div className="flex items-end justify-between gap-3">
          <span className="grid gap-0.5">
            <span className={styles.rowMeta}>Reports today</span>
            {totals.people
              ? <span className="font-[family-name:var(--font-dashboard-heading)] text-[19px] leading-6 font-medium">{totals.reportedToday} of {totals.people}</span>
              : <span className="text-[13.5px] leading-5 text-(--color-text-strong)">No one in your groups yet</span>}
          </span>
          {totals.people ? <span className={styles.pill} data-tone={pending.length ? "risk" : "ok"}>{pending.length ? `${pending.length} pending` : "All in"}</span> : null}
        </div>
        {totals.people ? <span className="h-1.5 overflow-hidden rounded-full bg-[#eceef2]" aria-hidden="true"><i className="block h-full rounded-full bg-[var(--color-community-blue)]" style={{ width: `${share}%` }} /></span> : null}
      </div>
      <div className="grid grid-cols-3 border-t border-(--color-line) py-2.5">
        {stats.map(([label, value], index) => <span key={label} className={`grid gap-px px-3.5 ${index ? "border-l border-(--color-line)" : ""}`}>
          <span className="text-[11.5px] leading-[15px] text-[var(--color-community-muted)]">{label}</span>
          <span className="font-[family-name:var(--font-dashboard-heading)] text-[17px] leading-6 font-medium" style={{ color: value > 0 ? "#92400e" : undefined }}>{value}</span>
        </span>)}
      </div>
    </section>

    <div className={styles.sectionTitle}><h2>Needs you</h2><Link href={`${OVERSIGHT_PATH}/reports${data.under ? `?under=${encodeURIComponent(data.under.userId)}` : ""}`} className={styles.quiet}>All reports</Link></div>
    {attention.length || pending.length ? <div className={styles.panel}><ul className={styles.list}>
      {attention.map(item => <li key={item.key}><Link href={item.href} className={styles.row}>
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={{ background: item.tone[0], color: item.tone[1] }} aria-hidden="true">{item.icon}</span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{item.title}</span><span className={styles.rowMeta}>{item.meta}</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></li>)}
      {pending.slice(0, 4).map(person => <li key={person.userId}><Link href={reportHref(person.userId)} className={styles.row}>
        <Initials name={person.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{person.name}</span><span className={styles.rowMeta}>{[placeOf(person, focusLeads), person.silentDays >= 3 ? `no report in ${person.silentDays} days` : "no report yet today"].filter(Boolean).join(" · ")}</span></span>
        <span className={styles.pill} data-tone={person.silentDays >= 3 ? "off" : "risk"}>Not yet</span>
      </Link></li>)}
    </ul></div> : <p className={`${styles.panel} ${styles.empty}`}>{totals.people ? "Nothing needs you right now. Everyone has reported today." : "Nothing needs you right now."}</p>}

    {data.groups.length ? <>
      <div className={styles.sectionTitle}><h2>{data.under ? `${data.under.name.split(" ")[0]}’s groups` : "Your groups"}</h2></div>
      <div className={styles.panel}><ul className={styles.list}>
        {data.groups.map((group, index) => {
          const body = <>
            {/* The same illustrated cut as Community Home's group cards, alternating colourways oldest first. */}
            <span className="size-10 shrink-0 rounded-[10px] bg-cover bg-center" style={{ backgroundColor: index % 2 ? "#e6ecfc" : "#e3d8f8", ...groupIcon(index % 2 ? "leading-slate" : "leading") }} aria-hidden="true" />
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{group.name}</span><span className={styles.rowMeta}>{plural(group.members, "member")}</span></span>
            <Rate done={group.reportedToday} total={group.members} />
          </>;
          return <li key={group.id}>{data.under ? <div className={styles.row}>{body}</div> : <Link href={`/dashboard/community/discipleship/${group.id}`} className={styles.row}>{body}</Link>}</li>;
        })}
      </ul></div>
    </> : null}

    {direct.length ? <>
      <div className={styles.sectionTitle}><h2>In {data.under ? "their" : "your"} groups</h2><span className={styles.rowMeta}>{direct.length}</span></div>
      <div className={styles.panel}><ul className={styles.list}>{direct.map(person => <PersonRow key={person.userId} person={person} focusLeads={focusLeads} />)}</ul></div>
      {data.people.length > direct.length ? <p className={styles.note}>{plural(data.people.length - direct.length, "more person")} in the groups they lead. Open “Their groups” to see them.</p> : null}
    </> : null}

    {data.branches.length ? <>
      <div className={styles.sectionTitle}><h2>{data.role === "pastor" ? "Branches" : "Your branches"}</h2></div>
      <div className={styles.panel}><ul className={styles.list}>
        {data.branches.map((branch, index) => <li key={branch.id}><Link href={`${OVERSIGHT_PATH}/branches/${branch.id}`} className={styles.row}>
          <Mark text={short(branch.name)} index={index} />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{branch.name}</span><span className={styles.rowMeta}>{[branch.pastors.join(", ") || "No branch pastor", plural(branch.people, "person")].join(" · ")}</span></span>
          <Rate done={branch.reportedToday} total={branch.people} />
        </Link></li>)}
      </ul></div>
    </> : null}
  </div>;
}

/** Everyone in view placed in one branch, the ones who haven't reported first. */
export function GroupOversightBranch({ data, branchId }: { data: GroupOversightData; branchId: number }) {
  const branch = data.branches.find(item => item.id === branchId)!;
  const people = data.people.filter(person => person.branchId === branchId)
    .sort((a, b) => Number(a.reportedToday) - Number(b.reportedToday) || b.silentDays - a.silentDays || a.name.localeCompare(b.name));
  return <div className={styles.page}>
    <div className={styles.heading}>
      <div><h1>{branch.name} branch</h1><p className={styles.sub}>{[branch.pastors.join(", ") || "No branch pastor", plural(branch.people, "person"), `${branch.learners} in SOGP`].join(" · ")}</p></div>
    </div>
    {people.length
      ? <div className={styles.panel}><ul className={styles.list}>{people.map(person => <PersonRow key={person.userId} person={person} focusLeads={false} />)}</ul></div>
      : <p className={`${styles.panel} ${styles.empty}`}>No one in this branch is in a group yet.</p>}
  </div>;
}

/** Leaders in view with questions unanswered past the wait, by name and count only. */
export function GroupQuestionsWaiting({ data }: { data: GroupOversightData }) {
  return <div className={styles.page}>
    <div className={styles.heading}><div><h1>Questions waiting</h1><p className={styles.sub}>Unanswered for more than 3 days</p></div></div>
    {data.waiting.length ? <div className={styles.panel}><ul className={styles.list}>
      {data.waiting.map(row => <li key={row.userId} className={styles.row}>
        <Initials name={row.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{row.name}</span><span className={styles.rowMeta}>{plural(row.waiting, "question")} · oldest {row.oldestDays} days</span></span>
        {row.messageUserId ? <MessageButton userId={row.messageUserId} /> : null}
      </li>)}
    </ul></div> : <p className={`${styles.panel} ${styles.empty}`}>Every question has been answered within 3 days.</p>}
    <p className={styles.note}><LockIcon className="mr-1 inline size-3 -translate-y-px" strokeWidth={2.2} aria-hidden />You see who has questions waiting and for how long, never the questions or answers. Only their group leader reads them.</p>
  </div>;
}
