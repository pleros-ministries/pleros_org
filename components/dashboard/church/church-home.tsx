"use client";
import Link from "next/link";
import { useState } from "react";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import type { ChurchBranchSummary, ChurchHome } from "@/lib/db/queries/church-home";
import styles from "@/components/sogp/follow-up-invitations.module.css";
import { PlaceChurchMember } from "./church-flows";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function UnitRows({ branch, manage }: { branch: ChurchBranchSummary; manage: boolean }) {
  if (!branch.units.length) return <p className={styles.muted}>No units yet.</p>;
  return <ul className={styles.list}>{branch.units.map(unit => {
    const body = <><span className={styles.avatar}>{unit.leader ? initials(unit.leader.name) : "—"}</span><div><strong>{unit.name}</strong><span className={styles.meta}>{unit.leader ? `${unit.leader.name} · ${plural(unit.workerCount, "worker")}` : "No leader yet"}</span></div>{manage ? <DashboardIcon name="right" size={16} /> : null}</>;
    return <li key={unit.id}>{manage ? <Link className={styles.row} href={unit.leader ? `/dashboard/church/units/${unit.id}/workers` : `/dashboard/church/units/${unit.id}/leader`}>{body}</Link> : <div className={styles.row}>{body}</div>}</li>;
  })}</ul>;
}

/** Paper: Pleros-church-pastor / -branch / -unit / -worker. */
export function ChurchHomeView({ data, canOversee }: { data: ChurchHome; canOversee: boolean }) {
  const [branchId, setBranchId] = useState(data.kind === "structure" ? data.branches[0]?.id ?? null : null);
  const oversight = canOversee ? <Link className={styles.secondary} href="/dashboard/church/reports">Daily reports for people you lead</Link> : null;

  if (data.kind === "none") return <section className={styles.page}><div className={styles.heading}><h1>Church</h1><p>You don’t have a church appointment yet. Your branch pastor or the Pastor sets appointments.</p></div></section>;

  if (data.kind === "placement") return <section className={styles.page}>
    <div className={styles.centred}><span className={`${styles.avatar} ${styles.avatarLarge}`}>{initials(data.name)}</span><h1>{data.name}</h1><span className={styles.meta}>Worker</span><StatusPill tone="neutral">View only</StatusPill></div>
    {data.unitName ? <div className={styles.panel}><strong>You serve in {data.unitName}</strong>{data.branchName ? <span className={styles.meta}>{data.branchName} branch</span> : null}</div> : null}
    <div className={styles.section}><h2>Your reporting line</h2><ol className={styles.list}>{data.line.map((row, index) => <li key={index} className={styles.row}><span className={styles.avatar}>{initials(row.name)}</span><div><strong>{row.scope}</strong><span className={styles.meta}>{row.name} · {row.role}{index === data.line.length - 1 ? " · You" : ""}</span></div></li>)}</ol></div>
    <div className={styles.info}><DashboardIcon name="people" size={16} /><p>Need a placement change? Speak with your branch pastor.</p></div>
  </section>;

  if (data.kind === "unit") return <section className={styles.page}>
    <div className={styles.heading}><span className={styles.eyebrow}>My unit</span><h1>{data.unit.name} team</h1><StatusPill tone="neutral">View only</StatusPill><p>Unit leader · {data.unit.name}{data.unit.branchName ? `, ${data.unit.branchName}` : ""}</p></div>
    <div className={styles.card}><div className={styles.person}><span className={styles.avatar}>{initials(data.leaderName)}</span><div><strong>{data.leaderName}</strong><span className={styles.meta}>Unit leader · {data.unit.name}{data.reportsTo ? ` · Reports to ${data.reportsTo}` : ""}</span></div></div></div>
    <div className={styles.section}><div className={styles.sectionHead}><h2>Direct workers</h2><span className={styles.meta}>{plural(data.workers.length, "worker")}</span></div>
      {data.workers.length ? <ul className={styles.list}>{data.workers.map(worker => <li key={worker.userId}><Link className={styles.row} href={`/dashboard/church/${encodeURIComponent(worker.userId)}`}><span className={styles.avatar}>{initials(worker.name)}</span><div><strong>{worker.name}</strong><span className={styles.meta}>Worker · {data.unit.name}</span></div><DashboardIcon name="right" size={16} /></Link></li>)}</ul> : <p className={styles.muted}>No workers are assigned to you yet.</p>}
    </div>
    {oversight}
    <div className={styles.info}><DashboardIcon name="lock" size={16} /><p>Appointments and assignments are managed by your branch pastor.</p></div>
  </section>;

  if (data.role === "pastor") return <section className={styles.page}>
    <div className={styles.heading}><span className={styles.eyebrow}>Church structure</span><h1>Fullness of Christ Church</h1><p>Pastor · Manage all branches</p></div>
    <div className={styles.statRow}>{([["Branches", data.totals.branches], ["Units", data.totals.units], ["Workers", data.totals.workers]] as const).map(([label, value]) => <div key={label}><strong>{value}</strong><span className={styles.meta}>{label}</span></div>)}</div>
    <div className={styles.section}><div className={styles.sectionHead}><h2>Branches</h2><Link className={styles.textLink} href="/dashboard/church/branches/new">Add branch</Link></div>
      {data.branches.length ? data.branches.map(branch => <article key={branch.id} className={styles.card}>
        <div className={styles.sectionHead}><strong style={{ fontSize: 18 }}>{branch.name}</strong>{branch.units.length ? <StatusPill tone={branch.leaderlessUnits ? "amber" : "green"}>{branch.units.length - branch.leaderlessUnits} of {branch.units.length} ready</StatusPill> : null}</div>
        <span className={styles.meta}>{branch.pastors.length ? branch.pastors.map(row => row.name).join(", ") + " · Branch pastor" : "No branch pastor yet"} · {plural(branch.workerCount, "worker")}</span>
        {branch.pastors.length ? null : <Link className={styles.textLink} style={{ justifyContent: "flex-start" }} href={`/dashboard/church/branches/${branch.id}/pastor`}>Appoint a branch pastor</Link>}
        <UnitRows branch={branch} manage />
      </article>) : <p className={styles.muted}>No branches yet. Create the first branch to start.</p>}
    </div>
    <PlaceChurchMember branches={data.branches} />
    {oversight}
  </section>;

  const branch = data.branches.find(row => row.id === branchId) ?? data.branches[0];
  return <section className={styles.page}>
    <div className={styles.heading}><span className={styles.eyebrow}>My branches</span><h1>Branch workspace</h1><p>Branch pastor · {plural(data.branches.length, "assigned branch", "assigned branches")}</p></div>
    {data.branches.length > 1 ? <div className={styles.tabs} role="tablist">{data.branches.map(row => <button key={row.id} type="button" role="tab" aria-selected={row.id === branch?.id} onClick={() => setBranchId(row.id)}>{row.name}</button>)}</div> : null}
    {branch ? <>
      <div className={styles.panel}><div className={styles.sectionHead}><strong>Unit setup</strong>{branch.units.length ? <StatusPill tone={branch.leaderlessUnits ? "amber" : "green"}>{branch.units.length - branch.leaderlessUnits} of {branch.units.length} ready</StatusPill> : null}</div>
        <span className={styles.meta}>{branch.leaderlessUnits ? `${plural(branch.leaderlessUnits, "unit needs", "units need")} a leader.` : branch.units.length ? "Every unit has a leader." : "Add a unit to start."}</span></div>
      <div className={styles.section}><div className={styles.sectionHead}><h2>{branch.name} units</h2><span className={styles.meta}>{plural(branch.workerCount, "worker")}</span></div><UnitRows branch={branch} manage /></div>
      <div className={styles.actions}>
        <Link className={styles.primary} href={`/dashboard/church/branches/${branch.id}/units/new`}>Add a unit<DashboardIcon name="plus" /></Link>
        {branch.units.some(unit => !unit.leader) ? <Link className={styles.secondary} href={`/dashboard/church/units/${branch.units.find(unit => !unit.leader)!.id}/leader`}>Appoint a unit leader</Link> : null}
      </div>
    </> : <p className={styles.muted}>No branch is assigned to you yet.</p>}
    <PlaceChurchMember branches={data.branches} />
    {oversight}
  </section>;
}
