"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { BellIcon, BellOffIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, ClipboardCheckIcon, LockIcon, MessageCircleQuestionIcon, UserPlusIcon } from "lucide-react";

import { remindChurchMember } from "@/app/(site)/dashboard/church/actions";
import { setOversightUpdateDone } from "@/app/(site)/dashboard/community/_actions/oversight-actions";
import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";
import { groupIcon } from "@/components/community/groups/group-hero";
import { MessageButton } from "@/components/community/messages/message-button";
import type { GroupOversightData, GroupOversightPerson } from "@/lib/db/queries/group-oversight";
import type { OversightUpdate } from "@/lib/db/queries/oversight-updates";

import { OversightHeader } from "./oversight-nav";
import { Mark as BranchMark, short } from "./oversight-view";

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

type ViewGroup = { id: number; name: string; leaderName: string | null; members: GroupOversightPerson[] };

/** The focus person's groups, the groups their members lead, and (Pastor and branch pastors) every other group in view. */
function groupsOf(data: GroupOversightData) {
  const inTree = data.people.filter(person => person.depth != null);
  const directIds = new Set(inTree.filter(person => person.depth === 1).map(person => person.userId));
  const own: ViewGroup[] = data.groups.map(group => ({ id: group.id, name: group.name, leaderName: null, members: inTree.filter(person => person.groupId === group.id && person.depth === 1) }));
  const collect = (people: GroupOversightPerson[]) => {
    const map = new Map<number, ViewGroup>();
    for (const person of people) {
      if (person.groupId == null) continue;
      const group = map.get(person.groupId) ?? { id: person.groupId, name: person.groupName ?? "Group", leaderName: person.overseerName, members: [] };
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

/** Structure: the groups you lead, the groups led by those you lead, and the wider view for the Pastor and branch pastors. */
export function OversightStructure({ data, updates }: { data: GroupOversightData; updates: number }) {
  const { own, under, other } = groupsOf(data);
  const who = data.under ? first(data.under.name) : null;
  const shared = { mode: "structure" as const, day: data.day, remind: false, tab: OVERSIGHT_PATH };
  return <div className={styles.page}>
    <Header data={data} updates={updates} />
    <Trail data={data} tab={OVERSIGHT_PATH} />
    {own.length ? <>
      <div className={styles.sectionTitle}><h2>{who ? `Groups ${who} leads` : "Groups you lead"}</h2><span className={styles.rowMeta}>{plural(own.length, "group")}</span></div>
      <GroupList groups={own} openFirst {...shared} />
    </> : null}
    {under.length ? <>
      <div className={styles.sectionTitle}><h2>Groups led by those {who ?? "you"} lead{who ? "s" : ""}</h2><span className={styles.rowMeta}>{plural(under.length, "group")}</span></div>
      <GroupList groups={under} offset={1} {...shared} />
    </> : null}
    {other.length ? <>
      <div className={styles.sectionTitle}><h2>{data.role === "pastor" ? "Every other group" : "Other groups in your branches"}</h2><span className={styles.rowMeta}>{plural(other.length, "group")}</span></div>
      <GroupList groups={other} {...shared} />
    </> : null}
    {!own.length && !under.length && !other.length ? <p className={`${styles.panel} ${styles.empty}`}>No groups yet.</p> : null}
    {!data.under && data.branches.length ? <>
      <div className={styles.sectionTitle}><h2>{data.role === "pastor" ? "Branches" : "Your branches"}</h2>{data.role === "pastor" ? <Link href={`${OVERSIGHT_PATH}/branches`} className={styles.quiet}>Manage</Link> : null}</div>
      <div className={styles.panel}><ul className={styles.list}>
        {data.branches.map((branch, index) => <li key={branch.id}><Link href={`${OVERSIGHT_PATH}/branches/${branch.id}`} className={styles.row}>
          <BranchMark text={short(branch.name)} index={index} />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{branch.name}</span><span className={styles.rowMeta}>{[branch.pastors.join(", ") || "No branch pastor", plural(branch.people, "person")].join(" · ")}</span></span>
          <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
        </Link></li>)}
      </ul></div>
    </> : null}
    <p className={styles.note}>Open a group to see its members. “Their groups” takes you into the groups that person leads.</p>
  </div>;
}

const dayChip = (day: string, today: string, index: number) => index === 0 ? "Today" : index === 1 ? "Yesterday"
  : new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`)).replace(",", "");

/** Reports: a day picker, then the groups you lead or the groups under them, each member's report in a few words. */
export function OversightReports({ data, updates, days, today, remind }: { data: GroupOversightData; updates: number; days: string[]; today: string; remind: boolean }) {
  const { own, under, other } = groupsOf(data);
  const [scope, setScope] = useState<"mine" | "under">(own.length || !other.length ? "mine" : "under");
  const groups = scope === "mine" ? own : [...under, ...other];
  const people = groups.flatMap(group => group.members);
  const tab = `${OVERSIGHT_PATH}/reports`;
  return <div className={styles.page}>
    <Header data={data} updates={updates} />
    <Trail data={data} tab={tab} extra={`day=${data.day}`} />
    <div className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Report day">
      {days.map((day, index) => <Link key={day} href={withUnder(tab, data.under?.userId, day === today ? "" : `day=${day}`)} scroll={false}
        aria-current={day === data.day ? "date" : undefined} className={`${styles.btn} ${styles.mini} shrink-0 no-underline`} data-primary={day === data.day ? "" : undefined}>{dayChip(day, today, index)}</Link>)}
    </div>
    <div className="grid grid-cols-2 rounded-[10px] bg-[#eceef2] p-[3px]" role="tablist" aria-label="Whose reports">
      {([["mine", data.under ? `Groups ${first(data.under.name)} leads` : "Groups you lead"], ["under", "Groups under them"]] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={scope === key} onClick={() => setScope(key)}
        className={`inline-flex h-8 min-w-0 items-center justify-center rounded-[7px] px-1 text-[13px] font-medium ${scope === key ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}><span className="truncate">{label}</span></button>)}
    </div>
    <div className={styles.strip}>
      <div><span>Reported</span><strong>{people.filter(reported).length}/{people.length}</strong></div>
      <div><span>Need a report</span><strong style={{ color: people.some(person => !reported(person)) ? "#92400e" : undefined }}>{people.filter(person => !reported(person)).length}</strong></div>
      <div><span>Groups</span><strong>{groups.length}</strong></div>
    </div>
    {groups.length
      ? <GroupList key={`${scope}-${data.day}`} groups={groups} openFirst mode="reports" day={data.day} remind={remind && data.day === today} tab={tab} />
      : <p className={`${styles.panel} ${styles.empty}`}>{scope === "mine" ? "No groups yet." : "No groups under them yet."}</p>}
    <p className={styles.note}>Open a group for each member’s report. “Their groups” takes you into the groups that person leads.</p>
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
    <p className={styles.note}>Oldest first, so you can work through them in order. Tap Done when you’ve dealt with one. Someone who is still quiet or behind a week later comes back.</p>
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
