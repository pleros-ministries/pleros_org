"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { BellIcon, BellOffIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, ClipboardCheckIcon, LayersIcon, LockIcon, MessageCircleQuestionIcon, UserPlusIcon } from "lucide-react";

import { remindChurchMember } from "@/app/(site)/dashboard/church/actions";
import { setOversightUpdateDone } from "@/app/(site)/dashboard/community/_actions/oversight-actions";
import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import { groupIcon } from "@/components/community/groups/group-hero";
import { MessageButton } from "@/components/community/messages/message-button";
import type { GroupOversightData, GroupOversightPerson } from "@/lib/db/queries/group-oversight";
import type { OversightUpdate } from "@/lib/db/queries/oversight-updates";

import { OversightHeader } from "./oversight-nav";

/**
 * Oversight as Structure, Reports and Updates (Pastor, 20 October; built from
 * the approved mockup). Groups open one level, to their members, never deeper;
 * "Their groups" opens the groups someone leads as a view of its own
 * (`?under=`). Reports name only what's missing; Updates is the old "Needs
 * you", oldest first, ticked off with Done.
 */

export const OVERSIGHT_PATH = "/dashboard/community/oversight";
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : word === "person" ? "people" : `${word}s`}`;
const first = (name: string) => name.split(" ")[0] || name;
const reportHref = (userId: string, day?: string) => `/dashboard/church/${encodeURIComponent(userId)}${day ? `?day=${day}` : ""}`;
const withUnder = (path: string, under: string | null | undefined, extra = "") => {
  const query = [under ? `under=${encodeURIComponent(under)}` : "", extra].filter(Boolean).join("&");
  return query ? `${path}?${query}` : path;
};
const reported = (person: GroupOversightPerson) => Object.values(person.statuses ?? {}).some(status => status !== "missing");
const AMBER = "#a15c12";

type ViewGroup = { id: number; name: string; leaderId: string | null; leaderName: string | null; members: GroupOversightPerson[] };

/** The focus person's groups, the groups their members lead, and (Pastor and branch pastors) every other group in view. */
function groupsOf(data: GroupOversightData) {
  const inTree = data.people.filter(person => person.depth != null);
  const directIds = new Set(inTree.filter(person => person.depth === 1).map(person => person.userId));
  const own: ViewGroup[] = data.groups.map(group => ({ id: group.id, name: group.name, leaderId: data.under?.userId ?? null, leaderName: null, members: inTree.filter(person => person.groupId === group.id && person.depth === 1) }));
  const collect = (people: GroupOversightPerson[]) => {
    const map = new Map<number, ViewGroup>();
    for (const person of people) {
      if (person.groupId == null) continue;
      const group = map.get(person.groupId) ?? { id: person.groupId, name: person.groupName ?? "Group", leaderId: person.overseerId, leaderName: person.overseerName, members: [] };
      group.members.push(person);
      map.set(person.groupId, group);
    }
    return [...map.values()].sort((a, b) => (a.leaderName ?? "").localeCompare(b.leaderName ?? "") || a.name.localeCompare(b.name));
  };
  const under = collect(inTree.filter(person => person.overseerId && directIds.has(person.overseerId)));
  // The wider view: groups whose leader isn't a member of a group in view; deeper ones open through "Their groups".
  const inView = new Set(data.people.filter(person => person.groupId != null).map(person => person.userId));
  const other = collect(data.people.filter(person => person.depth == null && person.overseerId && !inView.has(person.overseerId)));
  return { own, under, other };
}

function GroupIcon({ index }: { index: number }) {
  return <span className="size-10 shrink-0 rounded-[10px] bg-cover bg-center" style={{ backgroundColor: index % 2 ? "#e6ecfc" : "#e3d8f8", ...groupIcon(index % 2 ? "leading-slate" : "leading") }} aria-hidden="true" />;
}

/** The count alone, amber only when someone is missing. */
function Rate({ members }: { members: GroupOversightPerson[] }) {
  if (!members.length) return <span className={`${styles.rowMeta} shrink-0`}>No one yet</span>;
  const done = members.filter(reported).length;
  return <span className="shrink-0 text-right text-[12px] leading-4" style={{ color: done === members.length ? "var(--color-community-muted)" : AMBER }}>
    {done} of {members.length}<br /><span className="text-[var(--color-community-muted)]">reported</span>
  </span>;
}

/** A small dot and a word: green when it's in, amber when it's missing. */
function Dot({ ok, label }: { ok: boolean; label: string }) {
  return <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] leading-4" style={{ color: ok ? "var(--color-community-green-ink)" : AMBER }}>
    <i className="size-1.5 rounded-full" style={{ background: ok ? "var(--color-community-green-ink)" : "#d98a1f" }} aria-hidden="true" />{label}
  </span>;
}

/** The day's report in a few words: only what's missing is named. Nil counts as in. */
function ReportLine({ person }: { person: GroupOversightPerson }) {
  const parts = [["devotional", "Devotion"], ["ministry", "Ministry"], ["meetings", "Meetings"]] as const;
  const missing = parts.filter(([key]) => person.statuses?.[key] === "missing").map(([, label]) => label);
  const label = !missing.length ? "All in" : missing.length === parts.length ? "Not reported"
    : `${missing.map((name, index) => index ? name.toLowerCase() : name).join(", ")} missing`;
  return <Dot ok={!missing.length} label={label} />;
}

function Remind({ userId, day }: { userId: string; day: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  if (message) return <span className={`${styles.rowMeta} shrink-0 self-center`}>{message}</span>;
  return <button type="button" className={`${styles.quiet} inline-flex shrink-0 items-center gap-1 self-center`} disabled={pending}
    onClick={() => start(async () => {
      try { const result = await remindChurchMember(userId, day); setMessage(result.ok ? result.sent ? "Reminded" : "Already reminded" : result.error); }
      catch { setMessage("Couldn’t remind"); }
    })}><BellIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />Remind</button>;
}

function PersonRow({ person, mode, day, remind, tab }: { person: GroupOversightPerson; mode: "structure" | "reports"; day: string; remind: boolean; tab: string }) {
  return <li><div className={`${styles.row} items-start`} style={{ paddingLeft: 30 }}>
    <Initials name={person.name} />
    <Link href={reportHref(person.userId, mode === "reports" ? day : undefined)} className={`${styles.rowCopy} gap-1 text-inherit no-underline`}>
      <span className={styles.rowTitle}>{person.name}</span>
      {mode === "reports" ? <ReportLine person={person} />
        : person.leadsMembers ? <span className={styles.rowMeta}>Leads {plural(person.leadsMembers, "person")}</span> : null}
    </Link>
    {person.leadsMembers
      ? <Link href={withUnder(tab, person.userId, mode === "reports" ? `day=${day}` : "")} className={`${styles.quiet} inline-flex shrink-0 items-center gap-0.5 self-center`} aria-label={`Open ${person.name}’s groups`}>Their groups<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link>
      : mode === "reports" ? (!reported(person) && remind ? <Remind userId={person.userId} day={day} /> : null)
      : <span className="self-center"><Dot ok={reported(person)} label={reported(person) ? "Reported" : "Not yet"} /></span>}
  </div></li>;
}

function GroupBranch({ group, index, open: startOpen, mode, day, remind, tab }: { group: ViewGroup; index: number; open: boolean; mode: "structure" | "reports"; day: string; remind: boolean; tab: string }) {
  const [open, setOpen] = useState(startOpen);
  return <li>
    <button type="button" className={`${styles.row} w-full text-left`} aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <GroupIcon index={index} />
      <span className={styles.rowCopy}><span className={styles.rowTitle}>{group.name}</span><span className={styles.rowMeta}>{group.leaderName ? `Led by ${first(group.leaderName)} · ` : ""}{plural(group.members.length, "member")}</span></span>
      <Rate members={group.members} />
      <ChevronDownIcon className={`${styles.chev} size-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
    </button>
    {open ? group.members.length
      ? <ul className={styles.list} style={{ borderTop: "1px solid var(--color-line, #e7e9ec)" }}>
        {group.members.map(person => <PersonRow key={person.userId} person={person} mode={mode} day={day} remind={remind} tab={tab} />)}
      </ul>
      : <p className={`${styles.empty} border-t border-(--color-line)`}>No one in this group yet. Invite people from the group’s page.</p> : null}
  </li>;
}

function GroupList({ groups, offset = 0, openFirst = false, ...rest }: { groups: ViewGroup[]; offset?: number; openFirst?: boolean; mode: "structure" | "reports"; day: string; remind: boolean; tab: string }) {
  return <div className={styles.panel}><ul className={styles.list}>
    {groups.map((group, index) => <GroupBranch key={group.id} group={group} index={index + offset} open={openFirst && index === 0} {...rest} />)}
  </ul></div>;
}

/** Where you are when you've opened someone's groups: back one step, then whose groups these are. */
function Trail({ data, tab, extra = "" }: { data: GroupOversightData; tab: string; extra?: string }) {
  if (!data.under) return null;
  const back = data.under.backTo;
  return <div className="grid gap-1">
    <Link href={withUnder(tab, back?.userId, extra)} className={`${styles.quiet} inline-flex items-center gap-1`}>
      <ChevronRightIcon className="size-3.5 rotate-180" strokeWidth={2.2} aria-hidden="true" />{back ? `Back to ${first(back.name)}’s groups` : "Back to your groups"}
    </Link>
    <span className="font-[family-name:var(--font-dashboard-heading)] text-[17px] leading-6 font-medium">{first(data.under.name)}’s groups</span>
  </div>;
}

function Header({ data, updates }: { data: GroupOversightData; updates: number }) {
  const people = data.people.length;
  const sub = data.role === "leader" || data.under
    ? `${plural(data.groups.length, "group")} ${data.under ? `${first(data.under.name)} leads` : "you lead"} · ${plural(people, "person")} in all`
    : `${data.scopeLabel} · ${plural(people, "person")}`;
  return <OversightHeader sub={sub} updates={updates} under={data.under?.userId} />;
}

export const OTHER_GROUPS_PATH = `${OVERSIGHT_PATH}/other-groups`;
const otherGroupsTitle = (data: GroupOversightData) => data.role === "pastor" ? "Every other group" : "Other groups in your branches";

/** A group opens on Structure as its own view: its leader's tree, scoped to it. */
const groupHref = (group: ViewGroup) => withUnder(OVERSIGHT_PATH, group.leaderId, `group=${group.id}`);

/**
 * A group your members lead opens in place, a drop-down of its members and
 * their day (Pastor, 22 October), never straight to a page. Only "Groups its
 * members lead" goes a level deeper.
 */
function MemberLedGroup({ group, index, pageHref }: { group: ViewGroup; index: number; /** Your own group: its page, where you run it. */ pageHref?: string }) {
  const [open, setOpen] = useState(false);
  // Whether any member leads a group of their own; the group's own view lists them.
  const below = group.members.some(person => person.leadsMembers > 0);
  return <li>
    <button type="button" className={`${styles.row} w-full text-left`} aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <GroupIcon index={index} />
      <span className={`${styles.rowCopy} gap-0.5`}>
        <span className={styles.rowTitle} style={{ whiteSpace: "normal" }}>{group.name}</span>
        <span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>{group.leaderName ? `Led by ${group.leaderName} · ` : ""}{plural(group.members.length, "member")}</span>
      </span>
      <Rate members={group.members} />
      <ChevronDownIcon className={`${styles.chev} size-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
    </button>
    {open ? <div style={{ borderTop: "1px solid var(--color-line, #e7e9ec)" }}>
      {group.members.length ? <ul className={styles.list}>
        {group.members.map(person => <li key={person.userId}><Link href={reportHref(person.userId)} className={styles.row} style={{ paddingLeft: 30 }}>
          <Initials name={person.name} />
          <span className={`${styles.rowCopy} gap-1`}><span className={styles.rowTitle}>{person.name}</span><ReportLine person={person} /></span>
          <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
        </Link></li>)}
      </ul> : <p className={styles.empty}>No one in this group yet.</p>}
      {below || pageHref ? <span className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3" style={{ paddingLeft: 30 }}>
        {pageHref ? <Link href={pageHref} prefetch={false} className={`${styles.quiet} inline-flex items-center gap-0.5`}>Open the group page<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link> : null}
        {below ? <Link href={groupHref(group)} prefetch={false} className={`${styles.quiet} inline-flex items-center gap-0.5`}>Groups its members lead<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link> : null}
      </span> : null}
    </div> : null}
  </li>;
}

/**
 * Structure (Pastor, 21 October; groups, not people, 22 October): "we are not
 * dealing with people, except in reports". The groups you lead, then the
 * groups under you, each named with its leader and opening to its members and
 * the groups under it, one level at a time. Every other group is one panel
 * opening its own page. People's reports stay on Reports.
 */
export function OversightStructure({ data, updates, groupId = null }: { data: GroupOversightData; updates: number; groupId?: number | null }) {
  const { own, under, other } = groupsOf(data);
  const who = data.under ? first(data.under.name) : null;
  const opened = groupId != null ? own.find(group => group.id === groupId) ?? null : null;
  if (opened) return <OversightGroup data={data} group={opened} under={under} />;
  const otherPeople = other.reduce((n, group) => n + group.members.length, 0);
  return <div className={styles.page}>
    <Header data={data} updates={updates} />
    <Trail data={data} tab={OVERSIGHT_PATH} />
    {own.length ? <>
      <div className={styles.sectionTitle}><h2>{who ? `Groups ${who} leads` : "Groups you lead"}</h2><span className={styles.rowMeta}>{plural(own.length, "group")}</span></div>
      <div className={styles.panel}><ul className={styles.list}>
        {/* Every group drops down to its members (user, 23 October); your own also link to their page. */}
        {own.map((group, index) => <MemberLedGroup key={group.id} group={group} index={index} pageHref={who ? undefined : `/dashboard/community/discipleship/${group.id}`} />)}
      </ul></div>
    </> : null}
    {under.length ? <>
      <div className={styles.sectionTitle}><h2>{who ? `Groups ${who}’s members lead` : "Groups your members lead"}</h2><span className={styles.rowMeta}>{plural(under.length, "group")}</span></div>
      <div className={styles.panel}><ul className={styles.list}>
        {under.map((group, index) => <MemberLedGroup key={group.id} group={group} index={index + own.length} />)}
      </ul></div>
    </> : null}
    {!who && other.length ? <>
      <div className={styles.sectionTitle}><h2>{data.role === "pastor" ? "Across the church" : "Across your branches"}</h2></div>
      <div className={styles.panel}>
        <Link href={OTHER_GROUPS_PATH} className={styles.row}>
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]" aria-hidden="true"><LayersIcon className="size-[18px]" strokeWidth={2} /></span>
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{otherGroupsTitle(data)}</span><span className={styles.rowMeta}>{plural(other.length, "group")} · {plural(otherPeople, "person")}</span></span>
          <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
        </Link>
      </div>
    </> : null}
    {!own.length && !under.length && !other.length ? <p className={`${styles.panel} ${styles.empty}`}>No groups yet.</p> : null}
    <p className={styles.note}>Tap a group to see its members. People’s own reports are on Reports.</p>
    {!who && data.role === "pastor" ? <Link href={`${OVERSIGHT_PATH}/branches`} className={`${styles.quiet} -mt-1 ml-0.5`}>Branch setup</Link> : null}
  </div>;
}

/** One group under you, opened from Structure: its members with the day's report, then the groups under it. */
function OversightGroup({ data, group, under }: { data: GroupOversightData; group: ViewGroup; under: ViewGroup[] }) {
  const memberIds = new Set(group.members.map(person => person.userId));
  const below = under.filter(item => item.leaderId && memberIds.has(item.leaderId));
  const done = group.members.filter(reported).length;
  const back = data.under?.backTo;
  return <div className={styles.page}>
    <Link href={withUnder(OVERSIGHT_PATH, back?.userId)} className={`${styles.quiet} inline-flex items-center gap-1`}>
      <ChevronRightIcon className="size-3.5 rotate-180" strokeWidth={2.2} aria-hidden="true" />{back ? `Back to ${first(back.name)}’s groups` : "Back to Structure"}
    </Link>
    <div className={styles.heading}><div>
      <h1>{group.name}</h1>
      <p className={styles.sub}>{data.under ? `Led by ${data.under.name} · ` : ""}{plural(group.members.length, "member")}{group.members.length ? ` · ${done} of ${group.members.length} reported` : ""}</p>
    </div></div>
    <div className={styles.sectionTitle}><h2>Members</h2></div>
    {group.members.length ? <div className={styles.panel}><ul className={styles.list}>
      {group.members.map(person => <li key={person.userId}><Link href={reportHref(person.userId)} className={styles.row}>
        <Initials name={person.name} />
        <span className={`${styles.rowCopy} gap-1`}><span className={styles.rowTitle}>{person.name}</span><ReportLine person={person} /></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></li>)}
    </ul></div> : <p className={`${styles.panel} ${styles.empty}`}>No one in this group yet.</p>}
    {below.length ? <>
      <div className={styles.sectionTitle}><h2>Groups its members lead</h2><span className={styles.rowMeta}>{plural(below.length, "group")}</span></div>
      <div className={styles.panel}><ul className={styles.list}>
        {below.map((item, index) => <MemberLedGroup key={item.id} group={item} index={index + 1} />)}
      </ul></div>
    </> : null}
    <p className={styles.note}>A member opens their report. A group they lead opens in place, the same way.</p>
  </div>;
}

/** Every other group (Pastor) or the other groups in your branches: its own page, so Structure stays short. */
export function OversightOtherGroups({ data }: { data: GroupOversightData }) {
  const { other } = groupsOf(data);
  const people = other.reduce((n, group) => n + group.members.length, 0);
  return <div className={styles.page}>
    <CrumbLabel href={OTHER_GROUPS_PATH} label={otherGroupsTitle(data)} />
    <div className={styles.heading}><div><h1>{otherGroupsTitle(data)}</h1><p className={styles.sub}>{plural(other.length, "group")} · {plural(people, "person")} · by leader</p></div></div>
    {other.length ? <GroupList groups={other} mode="structure" day={data.day} remind={false} tab={OVERSIGHT_PATH} />
      : <p className={`${styles.panel} ${styles.empty}`}>No other groups yet. Groups appear here once their leaders invite people.</p>}
    <p className={styles.note}>Open a group to see its members. “Their groups” shows the groups that person leads.</p>
  </div>;
}

const dayChip = (day: string, today: string, index: number) => index === 0 ? "Today" : index === 1 ? "Yesterday"
  : new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`)).replace(",", "");

export const OTHER_REPORTS_PATH = `${OVERSIGHT_PATH}/reports/other-groups`;
const missingFirst = (a: GroupOversightPerson, b: GroupOversightPerson) => Number(reported(a)) - Number(reported(b)) || a.name.localeCompare(b.name);

function DayChips({ path, days, today, data }: { path: string; days: string[]; today: string; data: GroupOversightData }) {
  return <div className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Report day">
    {days.map((day, index) => <Link key={day} href={withUnder(path, data.under?.userId, day === today ? "" : `day=${day}`)} scroll={false}
      aria-current={day === data.day ? "date" : undefined} className={`${styles.btn} ${styles.mini} shrink-0 no-underline`} data-primary={day === data.day ? "" : undefined}>{dayChip(day, today, index)}</Link>)}
  </div>;
}

/**
 * Reports (Pastor, 21 October; option A of two mockups): no groups to open.
 * The members of your groups in one list with the day's report, the ones
 * still to report first; leaders carry "Their groups", the unreported Remind.
 * Every other group is one panel opening its own page.
 */
export function OversightReports({ data, updates, days, today, remind }: { data: GroupOversightData; updates: number; days: string[]; today: string; remind: boolean }) {
  const { own, other } = groupsOf(data);
  const who = data.under ? first(data.under.name) : null;
  const members = data.people.filter(person => person.depth === 1).sort(missingFirst);
  const missing = members.filter(person => !reported(person)).length;
  const otherPeople = other.flatMap(group => group.members);
  const tab = `${OVERSIGHT_PATH}/reports`;
  const dayQuery = data.day === today ? "" : `day=${data.day}`;
  const canRemind = remind && data.day === today;
  return <div className={styles.page}>
    <Header data={data} updates={updates} />
    <Trail data={data} tab={tab} extra={dayQuery} />
    <DayChips path={tab} days={days} today={today} data={data} />
    <div className={styles.strip}>
      <div><span>Reported</span><strong>{members.length - missing}/{members.length}</strong></div>
      <div><span>Need a report</span><strong style={{ color: missing ? "#92400e" : undefined }}>{missing}</strong></div>
      <div><span>{who ? "Groups" : "Your groups"}</span><strong>{own.length}</strong></div>
    </div>
    <div className={styles.sectionTitle}><h2>{who ? `${who}’s members` : "Your members"}</h2><span className={styles.rowMeta}>{plural(members.length, "person")}</span></div>
    {members.length ? <div className={styles.panel}><ul className={styles.list}>
      {members.map(person => <li key={person.userId}><div className={styles.row}>
        <Initials name={person.name} />
        <Link href={reportHref(person.userId, data.day)} className={`${styles.rowCopy} gap-1 text-inherit no-underline`}>
          <span className={styles.rowTitle}>{person.name}</span>
          <ReportLine person={person} />
        </Link>
        {person.leadsMembers
          ? <Link href={withUnder(tab, person.userId, dayQuery)} className={`${styles.btn} ${styles.mini}`} aria-label={`Open ${person.name}’s groups`}>Their groups<ChevronRightIcon className="-mr-1 size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link>
          : !reported(person) && canRemind ? <Remind userId={person.userId} day={data.day} /> : null}
      </div></li>)}
    </ul></div> : <p className={`${styles.panel} ${styles.empty}`}>No one in {who ? `${who}’s` : "your"} groups yet. Invite people from {who ? "their" : "your"} group’s page.</p>}
    {!who && other.length ? <>
      <div className={styles.sectionTitle}><h2>{data.role === "pastor" ? "Across the church" : "Across your branches"}</h2></div>
      <div className={styles.panel}>
        <Link href={`${OTHER_REPORTS_PATH}${dayQuery ? `?${dayQuery}` : ""}`} className={styles.row}>
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]" aria-hidden="true"><LayersIcon className="size-[18px]" strokeWidth={2} /></span>
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{otherGroupsTitle(data)}</span><span className={styles.rowMeta}>{plural(other.length, "group")} · {plural(otherPeople.length, "person")}</span></span>
          <Rate members={otherPeople} />
          <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
        </Link>
      </div>
    </> : null}
    <p className={styles.note}>Tap someone for their full report. “Their groups” shows the reports of the people that person leads.</p>
  </div>;
}

/** The day's reports for every other group: its own page, so Reports stays short. Groups open to their members' reports. */
export function OversightOtherReports({ data, days, today }: { data: GroupOversightData; days: string[]; today: string }) {
  const { other } = groupsOf(data);
  const people = other.flatMap(group => group.members);
  return <div className={styles.page}>
    <CrumbLabel href={OTHER_REPORTS_PATH} label={otherGroupsTitle(data)} />
    <div className={styles.heading}><div><h1>{otherGroupsTitle(data)}</h1><p className={styles.sub}>{people.filter(reported).length} of {plural(people.length, "person")} reported · by leader</p></div></div>
    <DayChips path={OTHER_REPORTS_PATH} days={days} today={today} data={data} />
    {other.length ? <GroupList key={data.day} groups={other} mode="reports" day={data.day} remind={false} tab={`${OVERSIGHT_PATH}/reports`} />
      : <p className={`${styles.panel} ${styles.empty}`}>No other groups yet. Groups appear here once their leaders invite people.</p>}
    <p className={styles.note}>Open a group for each member’s report.</p>
  </div>;
}

const UPDATE_ICON: Record<OversightUpdate["kind"], [React.ReactNode, string, string]> = {
  silent: [<BellOffIcon key="i" className="size-4" strokeWidth={2.2} />, "#f6dcdc", "#9b2c2c"],
  question: [<MessageCircleQuestionIcon key="i" className="size-4" strokeWidth={2.2} />, "#fde3cf", "#7a3a10"],
  risk: [<ClipboardCheckIcon key="i" className="size-4" strokeWidth={2.2} />, "#f7e4cd", "#92400e"],
  joined: [<UserPlusIcon key="i" className="size-4" strokeWidth={2.2} />, "#e4ebfd", "#2331ae"],
};
const whenFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" });

/** Updates: the old "Needs you", oldest first; Done moves one to the Done list, and back. */
export function OversightUpdates({ data, updates: initial }: { data: GroupOversightData; updates: OversightUpdate[] }) {
  const [view, setView] = useState<"todo" | "done">("todo");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const [updates, setOptimistic] = useOptimistic(initial, (current, change: { key: string; done: boolean }) => current.map(update => update.key === change.key ? { ...update, done: change.done } : update));
  const open = updates.filter(update => !update.done);
  const rows = view === "todo" ? open : updates.filter(update => update.done);
  const toggle = (key: string, done: boolean) => start(async () => {
    setError(null);
    setOptimistic({ key, done });
    const result = await setOversightUpdateDone(key, done).catch(() => ({ ok: false as const, error: "Couldn’t save that. Try again." }));
    if (!result.ok) setError(result.error);
  });
  return <div className={styles.page}>
    <Header data={data} updates={open.length} />
    <div className="grid grid-cols-2 rounded-[10px] bg-[#eceef2] p-[3px]" role="tablist" aria-label="Show">
      {([["todo", `To do · ${open.length}`], ["done", `Done · ${updates.length - open.length}`]] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)}
        className={`inline-flex h-8 items-center justify-center rounded-[7px] text-[13px] font-medium ${view === key ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>{label}</button>)}
    </div>
    {error ? <p className={styles.rowMeta} role="alert" style={{ color: "#9b2c2c" }}>{error}</p> : null}
    {rows.length ? <div className={styles.panel}><ul className={styles.list}>{rows.map(update => {
      const [icon, bg, ink] = UPDATE_ICON[update.kind];
      const detail = [update.detail, update.at ? whenFmt.format(new Date(update.at)) : null].filter(Boolean).join(" · ");
      return <li key={update.key}><div className={styles.row} style={{ alignItems: "flex-start", gap: 14, padding: "16px 14px" }}>
        <span className="grid size-10 shrink-0 place-items-center self-start rounded-[11px]" style={{ background: bg, color: ink, marginTop: -2 }} aria-hidden="true">{icon}</span>
        <span className={`${styles.rowCopy} gap-1`}>
          <span className={styles.rowTitle} style={{ whiteSpace: "normal", fontSize: 14, lineHeight: "20px" }}>{update.title}</span>
          {detail ? <span className={styles.rowMeta} style={{ whiteSpace: "normal", lineHeight: "18px" }}>{detail}</span> : null}
          <span className="mt-3 flex gap-2">
            <Link href={update.href} className={`${styles.btn} ${styles.mini} no-underline`}>Open<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link>
            {update.done
              ? <button type="button" className={`${styles.btn} ${styles.mini}`} onClick={() => toggle(update.key, false)}>Not done</button>
              : <button type="button" className={`${styles.btn} ${styles.mini}`} data-primary="" onClick={() => toggle(update.key, true)} aria-label={`Mark done: ${update.title}`}><CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />Done</button>}
          </span>
        </span>
      </div></li>;
    })}</ul></div> : <p className={`${styles.panel} ${styles.empty}`}>{view === "todo" ? "You’re all caught up." : "Nothing ticked off yet."}</p>}
    <p className={styles.note}>Only the people you lead: anything further down is for their leader. Oldest first; tap Done when you’ve dealt with one. Someone still quiet or behind a week later comes back.</p>
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
      ? <div className={styles.panel}><ul className={styles.list}>{people.map(person => <PersonRow key={person.userId} person={person} mode="reports" day={data.day} remind={false} tab={`${OVERSIGHT_PATH}/reports`} />)}</ul></div>
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
