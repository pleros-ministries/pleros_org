"use client";

import { useState } from "react";
import { BellIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, ClipboardCheckIcon, HandHeartIcon, MessageCircleQuestionIcon, UserPlusIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";
import { groupIcon } from "@/components/community/groups/group-hero";

/**
 * Mockup for the Pastor's 20 October review: Oversight as Structure, Reports
 * and Updates. Structure shows the groups you lead and the groups led by the
 * people you lead, each opening down to any depth; Reports splits the same way
 * with a day picker; Updates is the old "Needs you" as an ordered list you work
 * through and tick off. Sample data only.
 */

type Status = "reported" | "nil" | "missing";
type Person = { id: string; name: string; statuses: [Status, Status, Status]; groups?: Group[] };
type Group = { id: string; name: string; leader: string; members: Person[] };
type Update = { id: string; kind: "silent" | "question" | "joined" | "prayer" | "risk"; title: string; detail: string; at: string };

const ok: [Status, Status, Status] = ["reported", "reported", "reported"];
const part: [Status, Status, Status] = ["reported", "missing", "nil"];
const none: [Status, Status, Status] = ["missing", "missing", "missing"];

const SAMPLE: Group[] = [
  { id: "g1", name: "Campus fellowship", leader: "You", members: [
    { id: "p1", name: "Tolu Adebayo", statuses: ok, groups: [
      { id: "g3", name: "Hall C Bible study", leader: "Tolu", members: [
        { id: "p6", name: "Chidi Okafor", statuses: part },
        { id: "p7", name: "Ifeoma Nwosu", statuses: none, groups: [
          { id: "g5", name: "Freshers' prayer cell", leader: "Ifeoma", members: [
            { id: "p10", name: "Bisi Ojo", statuses: ok },
            { id: "p11", name: "Sola Martins", statuses: none },
          ] },
        ] },
      ] },
    ] },
    { id: "p2", name: "Efe Daniels", statuses: part },
    { id: "p3", name: "Kunle Bello", statuses: none },
  ] },
  { id: "g2", name: "Online SOGP members", leader: "You", members: [
    { id: "p4", name: "Grace Eze", statuses: ok, groups: [
      { id: "g4", name: "Grace's evening group", leader: "Grace", members: [
        { id: "p8", name: "Ruth Musa", statuses: ok },
        { id: "p9", name: "Dayo Ade", statuses: part },
      ] },
    ] },
    { id: "p5", name: "Amaka Obi", statuses: ok },
  ] },
];

const UPDATES: Update[] = [
  { id: "u1", kind: "silent", title: "Kunle hasn’t reported in 3 days", detail: "Campus fellowship", at: "Mon 8:12 pm" },
  { id: "u2", kind: "question", title: "2 questions waiting over 3 days", detail: "Tolu’s Hall C Bible study", at: "Tue 6:40 am" },
  { id: "u3", kind: "risk", title: "Ifeoma is at risk", detail: "Missed this week’s lessons · Hall C Bible study", at: "Tue 7:05 am" },
  { id: "u4", kind: "joined", title: "Dayo joined Grace’s evening group", detail: "Online SOGP members › Grace", at: "Tue 9:30 am" },
  { id: "u5", kind: "prayer", title: "Efe shared a prayer request", detail: "Campus fellowship", at: "Tue 10:02 am" },
];

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const reported = (person: Person) => person.statuses.some(status => status !== "missing");
const everyone = (groups: Group[]): Person[] => groups.flatMap(group => group.members.flatMap(person => [person, ...everyone(person.groups ?? [])]));
const indirect = (groups: Group[]): Group[] => groups.flatMap(group => group.members.flatMap(person => person.groups ?? []));

function Tabs({ tab, onTab, updates }: { tab: Tab; onTab: (tab: Tab) => void; updates: number }) {
  const tabs: Array<[Tab, string]> = [["structure", "Structure"], ["reports", "Reports"], ["updates", "Updates"]];
  return <nav aria-label="Oversight" className="grid grid-cols-3 rounded-[10px] bg-[#eceef2] p-[3px]">
    {tabs.map(([key, label]) => <button key={key} type="button" aria-current={tab === key ? "page" : undefined} onClick={() => onTab(key)}
      className={`inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-[7px] px-1 text-[13px] font-medium transition-colors ${tab === key ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>
      <span className="truncate">{label}</span>
      {key === "updates" && updates ? <span className="inline-grid box-border h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full leading-none tabular-nums bg-[#f7e4cd] px-1 text-[11px] font-medium text-[#92400e]">{updates}</span> : null}
    </button>)}
  </nav>;
}

function GroupIcon({ index }: { index: number }) {
  return <span className="size-10 shrink-0 rounded-[10px] bg-cover bg-center" style={{ backgroundColor: index % 2 ? "#e6ecfc" : "#e3d8f8", ...groupIcon(index % 2 ? "leading-slate" : "leading") }} aria-hidden="true" />;
}

function Rate({ group }: { group: Group }) {
  const done = group.members.filter(reported).length;
  return <span className="grid shrink-0 justify-items-end gap-1">
    <span className={styles.meter} aria-hidden="true"><i style={{ width: `${Math.round((done / Math.max(1, group.members.length)) * 100)}%` }} /></span>
    <span className={styles.rowMeta}>{done}/{group.members.length} today</span>
  </span>;
}

/** One group, opening to its members; a member who leads opens again, to any depth. */
function GroupBranch({ group, index, depth = 0, withStatus = false }: { group: Group; index: number; depth?: number; withStatus?: boolean }) {
  const [open, setOpen] = useState(depth === 0 && index === 0);
  return <li>
    <button type="button" className={`${styles.row} w-full text-left`} style={{ paddingLeft: 14 + depth * 16 }} aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <GroupIcon index={index} />
      <span className={styles.rowCopy}><span className={styles.rowTitle}>{group.name}</span><span className={styles.rowMeta}>{depth ? `Led by ${group.leader} · ` : ""}{plural(group.members.length, "member")}</span></span>
      <Rate group={group} />
      <ChevronDownIcon className={`${styles.chev} size-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
    </button>
    {open ? <ul className={styles.list} style={{ background: depth % 2 ? "white" : "#fafbfc" }}>
      {group.members.map(person => <PersonBranch key={person.id} person={person} depth={depth + 1} withStatus={withStatus} />)}
    </ul> : null}
  </li>;
}

function StatusPills({ statuses }: { statuses: Person["statuses"] }) {
  const labels = ["Devotion", "Ministry", "Meetings"];
  return <span className="flex flex-wrap gap-1">{statuses.map((status, index) => <span key={labels[index]} className={styles.pill} data-tone={status === "reported" ? "ok" : status === "missing" ? "risk" : undefined}>
    {labels[index]}{status === "reported" ? " ✓" : status === "nil" ? " · nil" : " · missing"}
  </span>)}</span>;
}

function PersonBranch({ person, depth, withStatus }: { person: Person; depth: number; withStatus: boolean }) {
  const [open, setOpen] = useState(false);
  const leads = person.groups ?? [];
  return <li>
    <div className={`${styles.row} items-start`} style={{ paddingLeft: 14 + depth * 16 }}>
      <Initials name={person.name} />
      <span className={`${styles.rowCopy} gap-1`}>
        <span className={styles.rowTitle}>{person.name}</span>
        {withStatus ? <StatusPills statuses={person.statuses} /> : <span className={styles.rowMeta}>{leads.length ? `Leads ${plural(leads.length, "group")} · ${plural(everyone(leads).length, "person", "people")}` : reported(person) ? "Reported today" : "No report yet today"}</span>}
      </span>
      {leads.length
        ? <button type="button" className={`${styles.btn} ${styles.mini}`} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? "Hide" : "Their groups"}<ChevronDownIcon className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.2} /></button>
        : withStatus && !reported(person) ? <button type="button" className={`${styles.btn} ${styles.mini}`}><BellIcon className="size-3.5" strokeWidth={2.2} />Remind</button>
        : <span className={styles.pill} data-tone={reported(person) ? "ok" : "risk"}>{reported(person) ? "Reported" : "Not yet"}</span>}
    </div>
    {open ? <ul className={styles.list}>{leads.map((group, index) => <GroupBranch key={group.id} group={group} index={index + 1} depth={depth} withStatus={withStatus} />)}</ul> : null}
  </li>;
}

function Structure() {
  const under = indirect(SAMPLE);
  return <>
    <div className={styles.sectionTitle}><h2>Groups you lead</h2><span className={styles.rowMeta}>{plural(SAMPLE.length, "group")}</span></div>
    <div className={styles.panel}><ul className={styles.list}>{SAMPLE.map((group, index) => <GroupBranch key={group.id} group={group} index={index} />)}</ul></div>
    <div className={styles.sectionTitle}><h2>Groups led by those you lead</h2><span className={styles.rowMeta}>{plural(under.length, "group")}</span></div>
    <div className={styles.panel}><ul className={styles.list}>{under.map((group, index) => <GroupBranch key={group.id} group={group} index={index + 1} depth={0} />)}</ul></div>
    <p className={styles.note}>Open a group to see its members. Anyone who leads a group opens again, as far down as it goes.</p>
  </>;
}

const DAYS = ["Today", "Yesterday", "Sun 18", "Sat 17", "Fri 16"];

function Reports() {
  const [day, setDay] = useState(DAYS[0]!);
  const [scope, setScope] = useState<"mine" | "under">("mine");
  const groups = scope === "mine" ? SAMPLE : indirect(SAMPLE);
  const people = everyone(groups);
  return <>
    <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="Report day">
      {DAYS.map(label => <button key={label} type="button" role="tab" aria-selected={day === label} onClick={() => setDay(label)}
        className={`${styles.btn} ${styles.mini} shrink-0`} data-primary={day === label ? "" : undefined}>{label}</button>)}
    </div>
    <div className="grid grid-cols-2 rounded-[10px] bg-[#eceef2] p-[3px]" role="tablist" aria-label="Whose reports">
      {([["mine", "Groups you lead"], ["under", "Groups under them"]] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={scope === key} onClick={() => setScope(key)}
        className={`inline-flex h-8 items-center justify-center rounded-[7px] text-[13px] font-medium ${scope === key ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>{label}</button>)}
    </div>
    <div className={styles.strip}>
      <div><span>Reported</span><strong>{people.filter(reported).length}/{people.length}</strong></div>
      <div><span>Need a report</span><strong style={{ color: "#92400e" }}>{people.filter(person => !reported(person)).length}</strong></div>
      <div><span>Groups</span><strong>{groups.length}</strong></div>
    </div>
    <div className={styles.panel}><ul className={styles.list}>{groups.map((group, index) => <GroupBranch key={`${scope}-${group.id}`} group={group} index={index} withStatus />)}</ul></div>
    <p className={styles.note}>{day} · open a group for each member’s report; open someone who leads to go down to their groups.</p>
  </>;
}

const UPDATE_ICON: Record<Update["kind"], [React.ReactNode, string, string]> = {
  silent: [<BellIcon key="i" className="size-4" strokeWidth={2.2} />, "#f6dcdc", "#9b2c2c"],
  question: [<MessageCircleQuestionIcon key="i" className="size-4" strokeWidth={2.2} />, "#fde3cf", "#7a3a10"],
  risk: [<ClipboardCheckIcon key="i" className="size-4" strokeWidth={2.2} />, "#f7e4cd", "#92400e"],
  joined: [<UserPlusIcon key="i" className="size-4" strokeWidth={2.2} />, "#e4ebfd", "#2331ae"],
  prayer: [<HandHeartIcon key="i" className="size-4" strokeWidth={2.2} />, "#efe7fb", "#56209c"],
};

function Updates({ done, onDone }: { done: Set<string>; onDone: (id: string) => void }) {
  const [view, setView] = useState<"todo" | "done">("todo");
  const rows = UPDATES.filter(update => (view === "done") === done.has(update.id));
  return <>
    <div className="grid grid-cols-2 rounded-[10px] bg-[#eceef2] p-[3px]" role="tablist" aria-label="Show">
      {([["todo", `To do · ${UPDATES.length - done.size}`], ["done", `Done · ${done.size}`]] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)}
        className={`inline-flex h-8 items-center justify-center rounded-[7px] text-[13px] font-medium ${view === key ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>{label}</button>)}
    </div>
    {rows.length ? <div className={styles.panel}><ul className={styles.list}>{rows.map(update => {
      const [icon, bg, ink] = UPDATE_ICON[update.kind];
      const isDone = done.has(update.id);
      // Room to breathe (user feedback, 20 October): the title on its own line, details under it, actions last.
      return <li key={update.id}><div className={styles.row} style={{ alignItems: "flex-start", gap: 14, padding: "16px 14px" }}>
        <span className="grid size-10 shrink-0 place-items-center self-start rounded-[11px]" style={{ background: bg, color: ink, marginTop: -2 }} aria-hidden="true">{icon}</span>
        <span className={`${styles.rowCopy} gap-1`}>
          <span className={styles.rowTitle} style={{ whiteSpace: "normal", fontSize: 14, lineHeight: "20px" }}>{update.title}</span>
          <span className={styles.rowMeta} style={{ whiteSpace: "normal", lineHeight: "18px" }}>{update.detail} · {update.at}</span>
          {/* Actions under the text, so the update reads in full on a phone. */}
          {isDone
            ? <span className={`${styles.pill} mt-2 justify-self-start`} data-tone="ok">Done</span>
            : <span className="mt-3 flex gap-2">
              <button type="button" className={`${styles.btn} ${styles.mini}`}>Open<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></button>
              <button type="button" className={`${styles.btn} ${styles.mini}`} data-primary="" onClick={() => onDone(update.id)} aria-label={`Mark done: ${update.title}`}><CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />Done</button>
            </span>}
        </span>
      </div></li>;
    })}</ul></div> : <p className={`${styles.panel} ${styles.empty}`}>{view === "todo" ? "You’re all caught up." : "Nothing ticked off yet."}</p>}
    <p className={styles.note}>Oldest first, so you can work through them in order. Tap Done when you’ve dealt with one; it moves to Done.</p>
  </>;
}

type Tab = "structure" | "reports" | "updates";

export function OversightMockup({ initialTab = "structure" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [done, setDone] = useState<Set<string>>(new Set());
  const people = everyone(SAMPLE);
  return <div className={`${styles.page} mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7`}>
    <div className={styles.heading}><div><h1 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[21px] leading-7 font-medium">Oversight</h1><p className={styles.sub}>{plural(SAMPLE.length, "group")} you lead · {plural(people.length, "person", "people")} in all</p></div></div>
    <Tabs tab={tab} onTab={setTab} updates={UPDATES.length - done.size} />
    {tab === "structure" ? <Structure /> : tab === "reports" ? <Reports /> : <Updates done={done} onDone={id => setDone(current => new Set(current).add(id))} />}
  </div>;
}
