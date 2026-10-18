"use client";

import Link from "next/link";
import { useState } from "react";
import { BellOffIcon, ChevronRightIcon, LockIcon, MessageCircleQuestionIcon, PlusIcon, UsersRoundIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { Initials } from "@/components/community/discipleship/shared";
import { GroupTabs } from "@/components/community/groups/group-hero";
import { MessageButton } from "@/components/community/messages/message-button";
import type { OversightData, OversightDiscipler } from "@/lib/db/queries/oversight";

import { OversightHeader } from "./oversight-nav";

export const OVERSIGHT_PATH = "/dashboard/community/oversight";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const tones: Array<[string, string]> = [["#e6ecfc", "#1f3260"], ["#efe7fb", "#3e1876"], ["#f6e4ac", "#5a4508"], ["#fde3cf", "#7a3a10"], ["#cfe6fb", "#0e3f73"]];
export const short = (name: string) => {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words.slice(0, 2).map(part => part[0] ?? "").join("") : name.trim().slice(0, 2)).toUpperCase();
};

export function Mark({ text, index }: { text: string; index: number }) {
  const [bg, ink] = tones[index % tones.length]!;
  return <span className="grid size-10 shrink-0 place-items-center rounded-[10px] text-[13px] font-semibold" style={{ background: bg, color: ink, fontFamily: "var(--font-dashboard-heading)" }} aria-hidden="true">{text}</span>;
}

function Rate({ done, total }: { done: number; total: number }) {
  if (!total) return <span className={styles.rowMeta}>No workers yet</span>;
  return <span className="grid shrink-0 justify-items-end gap-1">
    <span className={styles.meter} aria-hidden="true"><i style={{ width: `${Math.round((done / total) * 100)}%` }} /></span>
    <span className={styles.rowMeta}>{done}/{total} today</span>
  </span>;
}

export function Strip({ items }: { items: Array<[string, number | string, boolean?]> }) {
  return <div className={styles.strip}>
    {items.map(([label, value, warn]) => <div key={label}><span>{label}</span><strong style={{ color: warn ? "#92400e" : undefined }}>{value}</strong></div>)}
  </div>;
}

/** The church (Pastor) or the viewer's branches (Branch Pastor) at a glance. */
export function OversightOverview({ data }: { data: OversightData }) {
  const silent = data.workers.filter(worker => worker.silentDays >= 3);
  const leaderless = data.branches.flatMap(branch => branch.units.filter(unit => !unit.leader).map(unit => ({ ...unit, branchName: branch.name })));
  const waitingDisciplers = data.disciplers.filter(row => row.waiting > 0);
  const attention = [
    data.totals.waiting ? { key: "questions", href: `${OVERSIGHT_PATH}/questions`, tone: ["#fde3cf", "#7a3a10"], icon: <MessageCircleQuestionIcon className="size-4" strokeWidth={2.2} />, title: `${plural(data.totals.waiting, "question")} waiting over 3 days`, meta: `${plural(waitingDisciplers.length, "discipler")} · ${[...new Set(waitingDisciplers.map(row => row.branchName).filter(Boolean))].join(", ") || "your branches"}` } : null,
    silent.length ? { key: "silent", href: `${OVERSIGHT_PATH}/reports`, tone: ["#f6dcdc", "#9b2c2c"], icon: <BellOffIcon className="size-4" strokeWidth={2.2} />, title: `${plural(silent.length, "worker")} haven’t reported in 3 days`, meta: `Across ${plural(new Set(silent.map(worker => worker.branchId)).size, "branch")}` } : null,
    leaderless.length ? { key: "leaderless", href: `${OVERSIGHT_PATH}/branches/${leaderless[0]!.branchId}`, tone: ["#efe7fb", "#56209c"], icon: <UsersRoundIcon className="size-4" strokeWidth={2.2} />, title: `${plural(leaderless.length, "unit")} without a leader`, meta: leaderless.slice(0, 3).map(unit => `${unit.branchName} · ${unit.name}`).join(", ") } : null,
  ].filter(Boolean) as Array<{ key: string; href: string; tone: string[]; icon: React.ReactNode; title: string; meta: string }>;

  const pending = data.workers.filter(worker => !worker.reportedToday).sort((a, b) => b.silentDays - a.silentDays);
  const share = data.totals.expected ? Math.round((data.totals.reportedToday / data.totals.expected) * 100) : 0;
  const ready = data.totals.units - leaderless.length;
  const stats: Array<[string, number]> = [["At risk", data.totals.atRisk], ["Questions", data.totals.waiting], ["Silent 3+ days", silent.length]];
  // Three blocks (user feedback, 18 October: too many panels): today, one "needs you" list, branches.
  return <div className={styles.page}>
    <OversightHeader sub={`${data.scopeLabel} · ${plural(data.totals.branches, "branch")} · ${plural(data.totals.workers, "worker")}`} />

    <section className={styles.panel} aria-label="Today">
      <div className="grid gap-2.5 p-3.5">
        <div className="flex items-end justify-between gap-3">
          <span className="grid gap-0.5">
            <span className={styles.rowMeta}>Reports today</span>
            {/* The heading face is for the number only; an empty state reads as body text. */}
            {data.totals.expected
              ? <span className="font-[family-name:var(--font-dashboard-heading)] text-[19px] leading-6 font-medium">{data.totals.reportedToday} of {data.totals.expected}</span>
              : <span className="text-[13.5px] leading-5 text-(--color-text-strong)">No workers placed yet</span>}
          </span>
          {data.totals.expected ? <span className={styles.pill} data-tone={pending.length ? "risk" : "ok"}>{pending.length ? `${pending.length} pending` : "All in"}</span> : null}
        </div>
        {data.totals.expected ? <span className="h-1.5 overflow-hidden rounded-full bg-[#eceef2]" aria-hidden="true"><i className="block h-full rounded-full bg-[var(--color-community-blue)]" style={{ width: `${share}%` }} /></span> : null}
      </div>
      <div className="grid grid-cols-3 border-t border-(--color-line) py-2.5">
        {stats.map(([label, value], index) => <span key={label} className={`grid gap-px px-3.5 ${index ? "border-l border-(--color-line)" : ""}`}>
          <span className="text-[11.5px] leading-[15px] text-[var(--color-community-muted)]">{label}</span>
          <span className="font-[family-name:var(--font-dashboard-heading)] text-[17px] leading-6 font-medium" style={{ color: value > 0 ? "#92400e" : undefined }}>{value}</span>
        </span>)}
      </div>
    </section>

    <div className={styles.sectionTitle}><h2>Needs you</h2><Link href={`${OVERSIGHT_PATH}/reports`} className={styles.quiet}>All reports</Link></div>
    {attention.length || pending.length ? <div className={styles.panel}><ul className={styles.list}>
      {attention.map(item => <li key={item.key}><Link href={item.href} className={styles.row}>
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={{ background: item.tone[0], color: item.tone[1] }} aria-hidden="true">{item.icon}</span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{item.title}</span><span className={styles.rowMeta}>{item.meta}</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></li>)}
      {pending.slice(0, 4).map(worker => <li key={worker.userId}><Link href={`/dashboard/church/${worker.userId}`} className={styles.row}>
        <Initials name={worker.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{worker.name}</span><span className={styles.rowMeta}>{[worker.role === "unit_leader" ? "Unit leader" : "Worker", data.branches.find(branch => branch.id === worker.branchId)?.name, worker.silentDays >= 3 ? `no report in ${worker.silentDays} days` : "no report yet today"].filter(Boolean).join(" · ")}</span></span>
        <span className={styles.pill} data-tone={worker.silentDays >= 3 ? "off" : "risk"}>Not yet</span>
      </Link></li>)}
    </ul></div> : <p className={`${styles.panel} ${styles.empty}`}>{data.totals.expected ? "Nothing needs you right now. Everyone has reported today." : "Nothing needs you right now."}</p>}

    <div className={styles.sectionTitle}>
      <h2>{data.role === "pastor" ? "Branches" : "Your branches"}</h2>
      <Link href={`${OVERSIGHT_PATH}/structure`} className={styles.quiet}>Manage</Link>
    </div>
    {data.branches.length ? <div className={styles.panel}>
      <p className="m-0 border-b border-(--color-line) px-3.5 py-2.5 text-[12px] leading-4 text-[var(--color-community-muted)]">
        {plural(data.totals.branches, "branch")} · {data.totals.units ? `${ready} of ${plural(data.totals.units, "unit")} ready` : "no units yet"} · {plural(data.totals.workers, "worker")}
      </p>
      <ul className={styles.list}>
        {data.branches.map((branch, index) => <li key={branch.id}><Link href={`${OVERSIGHT_PATH}/branches/${branch.id}`} className={styles.row}>
          <Mark text={short(branch.name)} index={index} />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{branch.name}</span><span className={styles.rowMeta}>{[branch.pastors.map(pastor => pastor.name).join(", ") || "No branch pastor", plural(branch.units.length, "unit")].join(" · ")}</span></span>
          <Rate done={branch.reportedToday} total={branch.expected} />
        </Link></li>)}
      </ul>
    </div> : <p className={`${styles.panel} ${styles.empty}`}>No branches yet. Add one from Structure.</p>}
  </div>;
}

function DisciplerRow({ row }: { row: OversightDiscipler }) {
  return <li className={styles.row}>
    <Initials name={row.name} />
    <span className={styles.rowCopy}><span className={styles.rowTitle}>{row.name}</span><span className={styles.rowMeta}>{[plural(row.groups, "group"), plural(row.disciples, "disciple"), row.atRisk ? `${row.atRisk} at risk` : null].filter(Boolean).join(" · ")}</span></span>
    {row.waiting ? <span className={styles.pill} data-tone="risk">{row.waiting} waiting</span> : <span className={styles.pill}>All answered</span>}
  </li>;
}

type BranchTab = "units" | "disciplers" | "reports";

/** One branch: units with leaders and today's reports, its disciplers, and who reported. */
export function OversightBranch({ data, branchId }: { data: OversightData; branchId: number }) {
  const branch = data.branches.find(item => item.id === branchId)!;
  const [tab, setTab] = useState<BranchTab>("units");
  const workers = data.workers.filter(worker => worker.branchId === branchId);
  const disciplers = data.disciplers.filter(row => row.branchId === branchId);
  return <div className={styles.page}>
    <div className={styles.heading}>
      <div><h1>{branch.name} branch</h1><p className={styles.sub}>{[branch.pastors.map(pastor => pastor.name).join(", ") || "No branch pastor", plural(branch.units.length, "unit"), plural(branch.workerCount, "worker"), `${branch.learners} in SOGP`].join(" · ")}</p></div>
    </div>
    <GroupTabs tabs={[{ key: "units", label: "Units", count: branch.units.length }, { key: "disciplers", label: "Disciplers", count: disciplers.length }, { key: "reports", label: "Reports" }]} value={tab} onChange={setTab} />

    {tab === "units" ? <>
      {branch.units.length ? <div className={styles.panel}><ul className={styles.list}>
        {branch.units.map((unit, index) => {
          const inUnit = workers.filter(worker => worker.unitId === unit.id);
          return <li key={unit.id}><Link href={`/dashboard/church/units/${unit.id}/workers`} className={styles.row}>
            <Mark text={unit.name.slice(0, 2)} index={index} />
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{unit.name}</span><span className={styles.rowMeta}>{[unit.leader ? `Leader: ${unit.leader.name}` : null, plural(unit.workerCount, "worker")].filter(Boolean).join(" · ")}</span></span>
            {unit.leader ? <Rate done={inUnit.filter(worker => worker.reportedToday).length} total={inUnit.length} /> : <span className={styles.pill} data-tone="risk">No leader</span>}
          </Link></li>;
        })}
      </ul></div> : <p className={`${styles.panel} ${styles.empty}`}>No units yet.</p>}
      <Link href={`/dashboard/church/branches/${branchId}/units/new`} className={styles.quiet} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><PlusIcon className="size-3.5" strokeWidth={2.2} />Add a unit</Link>
    </> : null}

    {tab === "disciplers" ? (disciplers.length ? <>
      <div className={styles.panel}><ul className={styles.list}>{disciplers.map(row => <DisciplerRow key={row.enrollmentId} row={row} />)}</ul></div>
      <p className={styles.note}><LockIcon className="mr-1 inline size-3 -translate-y-px" strokeWidth={2.2} aria-hidden />Counts only. Only the discipler reads questions and answers.</p>
    </> : <p className={`${styles.panel} ${styles.empty}`}>No one in this branch leads a discipleship group with disciples yet.</p>) : null}

    {tab === "reports" ? (workers.length ? <div className={styles.panel}><ul className={styles.list}>
      {[...workers].sort((a, b) => Number(a.reportedToday) - Number(b.reportedToday) || b.silentDays - a.silentDays).map(worker => <li key={worker.userId}><Link href={`/dashboard/church/${worker.userId}`} className={styles.row}>
        <Initials name={worker.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{worker.name}</span><span className={styles.rowMeta}>{worker.role === "unit_leader" ? "Unit leader" : "Worker"}{worker.silentDays >= 3 ? " · no report in 3 days" : ""}</span></span>
        <span className={styles.pill} data-tone={worker.reportedToday ? "ok" : "risk"}>{worker.reportedToday ? "Reported" : "Not yet"}</span>
      </Link></li>)}
    </ul></div> : <p className={`${styles.panel} ${styles.empty}`}>No workers in this branch yet.</p>) : null}
  </div>;
}

/** Disciplers with questions unanswered past the wait, by name and count only. */
export function QuestionsWaiting({ data }: { data: OversightData }) {
  const rows = data.disciplers.filter(row => row.waiting > 0);
  return <div className={styles.page}>
    <div className={styles.heading}><div><h1>Questions waiting</h1><p className={styles.sub}>Unanswered for more than 3 days</p></div></div>
    {rows.length ? <div className={styles.panel}><ul className={styles.list}>
      {rows.map(row => <li key={row.enrollmentId} className={styles.row}>
        <Initials name={row.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{row.name}</span><span className={styles.rowMeta}>{[row.branchName, plural(row.waiting, "question"), row.oldestWaitingDays !== null ? `oldest ${row.oldestWaitingDays} days` : null].filter(Boolean).join(" · ")}</span></span>
        {row.messageUserId ? <MessageButton userId={row.messageUserId} /> : null}
      </li>)}
    </ul></div> : <p className={`${styles.panel} ${styles.empty}`}>Every question has been answered within 3 days.</p>}
    <p className={styles.note}><LockIcon className="mr-1 inline size-3 -translate-y-px" strokeWidth={2.2} aria-hidden />You see who has questions waiting and for how long, never the questions or answers. Only the discipler reads them.</p>
  </div>;
}
