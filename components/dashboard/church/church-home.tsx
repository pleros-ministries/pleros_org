"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronRightIcon, ClipboardListIcon, LockIcon, PlusIcon, UserPlusIcon, UsersRoundIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import type { ChurchBranchSummary, ChurchHome } from "@/lib/db/queries/church-home";

import { PlaceChurchMember, RenamePlace } from "./church-flows";
import { ChurchPage as Page, ChurchHeading as Heading } from "./church-ui";
import { Mark, short, Strip } from "./oversight-view";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Ready({ branch }: { branch: ChurchBranchSummary }) {
  if (!branch.units.length) return null;
  const ready = branch.units.length - branch.leaderlessUnits;
  return <span className={styles.pill} data-tone={branch.leaderlessUnits ? "risk" : "ok"}>{ready} of {branch.units.length} ready</span>;
}

function UnitRows({ branch }: { branch: ChurchBranchSummary }) {
  if (!branch.units.length) return <p className={styles.empty}>No units yet. Add the first one below.</p>;
  return <ul className={styles.list}>{branch.units.map((unit, index) => <li key={unit.id}>
    <Link className={styles.row} href={unit.leader ? `/dashboard/church/units/${unit.id}/workers` : `/dashboard/church/units/${unit.id}/leader`}>
      <Mark text={short(unit.name)} index={index} />
      <span className={styles.rowCopy}>
        <span className={styles.rowTitle}>{unit.name}</span>
        <span className={styles.rowMeta}>{unit.leader ? `${unit.leader.name} · ${plural(unit.workerCount, "worker")}` : "No leader yet"}</span>
      </span>
      {unit.leader ? null : <span className={styles.pill} data-tone="risk">Needs a leader</span>}
      <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
    </Link>
  </li>)}</ul>;
}

function ActionRow({ href, icon, tone, title, meta }: { href: string; icon: ReactNode; tone: [string, string]; title: string; meta: string }) {
  return <li><Link href={href} className={styles.row}>
    <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={{ background: tone[0], color: tone[1] }} aria-hidden="true">{icon}</span>
    <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}</span><span className={styles.rowMeta}>{meta}</span></span>
    <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
  </Link></li>;
}

function Placement({ branches }: { branches: ChurchBranchSummary[] }) {
  return <div className={`${styles.panel} px-3.5 pt-3.5 pb-3.5`}><PlaceChurchMember branches={branches} /></div>;
}

function Note({ children }: { children: ReactNode }) {
  return <p className={`${styles.note} flex items-start gap-2`}><LockIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />{children}</p>;
}

/** Church structure (Paper: Pleros-church-pastor / -branch / -unit / -worker), in the Oversight style. */
export function ChurchHomeView({ data, canOversee, header, unitsRetired = false }: { data: ChurchHome; canOversee: boolean;
  /** Inside Oversight: its shared header replaces this page's own heading. */
  header?: ReactNode;
  /** Groups as oversight: units and workers are retired, so Structure is branches and branch pastors only. */
  unitsRetired?: boolean }) {
  const [branchId, setBranchId] = useState(data.kind === "structure" ? data.branches[0]?.id ?? null : null);
  const reports = canOversee ? <ActionRow href={header ? "/dashboard/community/oversight/reports" : "/dashboard/church/reports"} icon={<ClipboardListIcon className="size-4" strokeWidth={2.2} />} tone={["#e4ebfd", "#2331ae"]} title="Daily reports" meta="For the people you lead" /> : null;

  if (data.kind === "none") return <Page>
    <Heading title="Church" sub="No church appointment yet" />
    <p className={`${styles.panel} ${styles.empty}`}>Your branch pastor or the Pastor sets appointments. Once you’re placed, your unit and reporting line show here.</p>
  </Page>;

  if (data.kind === "placement") return <Page>
    <Heading title="My church placement" sub={[data.unitName, data.branchName ? `${data.branchName} branch` : null].filter(Boolean).join(" · ") || "Worker"} tag="View only" />
    <div className={styles.sectionTitle}><h2>Your reporting line</h2></div>
    <div className={styles.panel}><ol className={styles.list}>{data.line.map((row, index) => <li key={index}><div className={styles.row}>
      <Mark text={short(row.name)} index={index} />
      <span className={styles.rowCopy}><span className={styles.rowTitle}>{row.scope}</span><span className={styles.rowMeta}>{row.name} · {row.role}{index === data.line.length - 1 ? " · You" : ""}</span></span>
    </div></li>)}</ol></div>
    <Note>Need a placement change? Speak with your branch pastor.</Note>
  </Page>;

  if (data.kind === "unit") return <Page>
    <Heading title={`${data.unit.name} team`} sub={`Unit leader${data.unit.branchName ? ` · ${data.unit.branchName}` : ""}${data.reportsTo ? ` · Reports to ${data.reportsTo}` : ""}`} />
    <div className={styles.sectionTitle}><h2>Direct workers</h2><span className={styles.rowMeta}>{plural(data.workers.length, "worker")}</span></div>
    {data.workers.length ? <div className={styles.panel}><ul className={styles.list}>{data.workers.map((worker, index) => <li key={worker.userId}><Link className={styles.row} href={`/dashboard/church/${encodeURIComponent(worker.userId)}`}>
      <Mark text={short(worker.name)} index={index} />
      <span className={styles.rowCopy}><span className={styles.rowTitle}>{worker.name}</span><span className={styles.rowMeta}>Worker · {data.unit.name}</span></span>
      <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
    </Link></li>)}</ul></div> : <p className={`${styles.panel} ${styles.empty}`}>No workers are assigned to you yet.</p>}
    <div className={styles.sectionTitle}><h2>Manage</h2></div>
    <div className={styles.panel}><ul className={styles.list}>
      <ActionRow href={`/dashboard/church/units/${data.unit.id}/workers`} icon={<UserPlusIcon className="size-4" strokeWidth={2.2} />} tone={["#e4ebfd", "#2331ae"]} title="Add workers" meta={`People who serve in ${data.unit.name} with you`} />
      {reports}
    </ul></div>
    <Note>You add workers to your unit. Your branch pastor manages leaders and moves people between units.</Note>
  </Page>;

  if (data.role === "pastor") return <Page bare={Boolean(header)}>
    {header ?? <Heading title="Church structure" sub="Fullness of Christ Church · all branches" />}
    {unitsRetired
      ? <Strip items={[["Branches", data.totals.branches], ["Branch pastors", data.branches.reduce((n, branch) => n + branch.pastors.length, 0)], ["Need a pastor", data.branches.filter(branch => !branch.pastors.length).length, data.branches.some(branch => !branch.pastors.length)]]} />
      : <Strip items={[["Branches", data.totals.branches], ["Units", data.totals.units], ["Workers", data.totals.workers]]} />}
    <div className={styles.sectionTitle}><h2>Branches</h2><Link href="/dashboard/church/branches/new" className={`${styles.quiet} inline-flex items-center gap-1`}><PlusIcon className="size-3.5" strokeWidth={2.2} />Add branch</Link></div>
    {data.branches.length ? data.branches.map(branch => <section key={branch.id} className={styles.panel} aria-label={branch.name}>
      <div className="flex items-start justify-between gap-3 px-3.5 pt-3.5 pb-1">
        <span className={styles.rowCopy}>
          <span className="font-[family-name:var(--font-dashboard-heading)] text-[15px] leading-[22px] font-medium">{branch.name}</span>
          <span className={styles.rowMeta}>{branch.pastors.length ? `${branch.pastors.map(row => row.name).join(", ")} · Branch pastor` : "No branch pastor yet"}{unitsRetired ? "" : ` · ${plural(branch.workerCount, "worker")}`}</span>
        </span>
        {unitsRetired ? null : <Ready branch={branch} />}
      </div>
      <div className="flex flex-wrap px-3.5 pb-1"><RenamePlace key={branch.name} kind="branch" id={branch.id} name={branch.name} /></div>
      {branch.pastors.length ? null : <Link className={`${styles.quiet} mx-3.5 my-1 inline-flex items-center gap-1`} href={`/dashboard/church/branches/${branch.id}/pastor`}><UserPlusIcon className="size-3.5" strokeWidth={2.2} />Appoint a branch pastor</Link>}
      {unitsRetired ? <div className="h-2" aria-hidden="true" /> : <>
        <UnitRows branch={branch} />
        <div className="flex justify-end border-t border-(--color-line) px-3.5 py-2.5">
          <Link href={`/dashboard/church/branches/${branch.id}/units/new`} className={`${styles.quiet} inline-flex items-center gap-1`}><PlusIcon className="size-3.5" strokeWidth={2.2} />Add a unit</Link>
        </div>
      </>}
    </section>) : <p className={`${styles.panel} ${styles.empty}`}>No branches yet. Add the first branch to start.</p>}
    {reports ? <><div className={styles.sectionTitle}><h2>Reports</h2></div><div className={styles.panel}><ul className={styles.list}>{reports}</ul></div></> : null}
    <Placement branches={data.branches} />
  </Page>;

  const branch = data.branches.find(row => row.id === branchId) ?? data.branches[0];
  const leaderless = branch?.units.find(unit => !unit.leader);
  return <Page bare={Boolean(header)}>
    {header ?? <Heading title="Church structure" sub={`Branch pastor · ${plural(data.branches.length, "branch", "branches")}`} />}
    {data.branches.length > 1 ? <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Your branches">
      {data.branches.map(row => <button key={row.id} type="button" role="tab" aria-selected={row.id === branch?.id} onClick={() => setBranchId(row.id)}
        className={`${styles.btn} ${row.id === branch?.id ? "" : "opacity-80"}`} data-primary={row.id === branch?.id ? "" : undefined}>{row.name}</button>)}
    </div> : null}
    {branch ? <>
      <Strip items={[["Units", branch.units.length], ["Need a leader", branch.leaderlessUnits, branch.leaderlessUnits > 0], ["Workers", branch.workerCount]]} />
      <div className={styles.sectionTitle}><h2>{branch.name} units</h2><Ready branch={branch} /></div>
      <div className={styles.panel}>
        <UnitRows branch={branch} />
      </div>
      <div className={styles.sectionTitle}><h2>Manage</h2></div>
      <div className={styles.panel}><ul className={styles.list}>
        <ActionRow href={`/dashboard/church/branches/${branch.id}/units/new`} icon={<PlusIcon className="size-4" strokeWidth={2.2} />} tone={["#e4ebfd", "#2331ae"]} title="Add a unit" meta={`A new team in ${branch.name}`} />
        {leaderless ? <ActionRow href={`/dashboard/church/units/${leaderless.id}/leader`} icon={<UsersRoundIcon className="size-4" strokeWidth={2.2} />} tone={["#efe7fb", "#56209c"]} title="Appoint a unit leader" meta={`${leaderless.name} has no leader yet`} /> : null}
        {reports}
      </ul></div>
    </> : <p className={`${styles.panel} ${styles.empty}`}>No branch is assigned to you yet.</p>}
    <Placement branches={data.branches} />
  </Page>;
}
