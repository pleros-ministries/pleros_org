"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addChurchPlace, addUnitWorkers, findChurchMembers, saveChurchAssignment, saveChurchBranchMembership } from "@/app/(site)/dashboard/church/actions";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import type { ChurchPlace } from "@/lib/db/queries/church-home";
import styles from "@/components/sogp/follow-up-invitations.module.css";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");
type Person = { id: string; name: string };

function SetupSteps({ step }: { step: 1 | 2 | 3 | 4 }) {
  return <div className={styles.steps} aria-label={`Step ${step} of 4`}>{["Branch", "Branch pastor", "Unit leaders", "Workers"].map((label, index) => <span key={label} data-active={index + 1 === step} data-done={index + 1 < step}><b>{index + 1}</b>{label}</span>)}</div>;
}

/** Names-only member search (searchChurchCandidates); never contact details. */
function PeopleSearch({ multiple, chosen, onChange, exclude = [] }: { multiple: boolean; chosen: Person[]; onChange: (people: Person[]) => void; exclude?: string[] }) {
  const [query, setQuery] = useState(""), [results, setResults] = useState<Person[] | null>(null), [error, setError] = useState<string | null>(null), [pending, start] = useTransition();
  const picked = new Set(chosen.map(person => person.id));
  const rows = [...chosen, ...(results ?? []).filter(person => !picked.has(person.id) && !exclude.includes(person.id))];
  return <div className={styles.section}>
    <form className={styles.actions} style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }} onSubmit={event => { event.preventDefault(); if (query.trim().length < 2) { setError("Type at least two letters."); return; } start(async () => { try { setResults(await findChurchMembers(query)); setError(null); } catch { setError("Member search is unavailable."); } }); }}>
      <label className={styles.searchBox}><DashboardIcon name="search" size={20} /><span className="sr-only">Search church members</span><input type="search" placeholder="Search eligible people" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <button type="submit" className={styles.secondary} disabled={pending} style={{ minHeight: 44 }}>{pending ? "…" : "Search"}</button>
    </form>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {multiple && chosen.length ? <span className={styles.accent}>{chosen.length} selected</span> : null}
    {rows.length ? <div className={styles.list} style={{ display: "grid", gap: 8 }}>{rows.map(person => {
      const selected = picked.has(person.id);
      return <label key={person.id} className={styles.choice} data-selected={selected}><input type={multiple ? "checkbox" : "radio"} name="church-person" checked={selected} onChange={() => onChange(multiple ? selected ? chosen.filter(row => row.id !== person.id) : [...chosen, person] : [person])} /><span className={styles.avatar}>{initials(person.name)}</span><span><strong>{person.name}</strong><span className={styles.meta} style={{ display: "block" }}>Church member</span></span></label>;
    })}</div> : results ? <p className={styles.muted}>No members match.</p> : null}
  </div>;
}

export function PlaceChurchMember({ branches }: { branches: Array<{ id: number; name: string }> }) {
  const [chosen, setChosen] = useState<Person[]>([]);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function save() {
    const person = chosen[0];
    if (!person || !branchId) { setError("Choose a church member and branch."); return; }
    start(async () => {
      const result = await saveChurchBranchMembership({ userId: person.id, branchId });
      if (!result.ok) { setError(result.error); return; }
      setSaved(`${person.name} was placed in ${branches.find(branch => branch.id === branchId)?.name}.`);
      setChosen([]); setError(null);
    });
  }
  return <div className={styles.section}>
    <div className={styles.sectionHead}><h2>Church member placement</h2><StatusPill tone="neutral">Branch only</StatusPill></div>
    <p className={styles.muted}>Place ordinary members in a branch without giving them a staff or church-office role.</p>
    <PeopleSearch multiple={false} chosen={chosen} onChange={setChosen} />
    <label className={styles.field}>Branch<select value={branchId} onChange={event => setBranchId(Number(event.target.value))}>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {saved ? <p className={styles.accent}>{saved}</p> : null}
    <button type="button" className={styles.primary} disabled={pending || !chosen.length || !branchId} onClick={save}>{pending ? "Saving…" : "Place in branch"}<DashboardIcon name="check" /></button>
  </div>;
}

/** Paper: Pleros-create-branch (step 1 of 4) and the retained add-unit capability. */
export function CreatePlace({ branch }: { branch?: { id: number; name: string } }) {
  const router = useRouter(); const [name, setName] = useState(""); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  function save() {
    if (!name.trim()) { setError(branch ? "Enter the unit name." : "Enter the branch name."); return; }
    start(async () => {
      const result = await addChurchPlace({ name, branchId: branch?.id });
      if (!result.ok) { setError(result.error); return; }
      router.push(branch ? `/dashboard/church/units/${result.id}/leader` : `/dashboard/church/branches/${result.id}/pastor`); router.refresh();
    });
  }
  return <section className={styles.page}>
    <div className={styles.heading}><span className={styles.eyebrow}>Church setup</span><h1>{branch ? `Add a unit in ${branch.name}` : "Create a branch"}</h1><p>{branch ? "Units group workers under one unit leader." : "Pastor · Manage all branches"}</p></div>
    {branch ? null : <SetupSteps step={1} />}
    <div className={styles.panel}><strong>Fullness of Christ Church</strong><span className={styles.meta}>{branch ? `${branch.name} branch` : "Add the branch name."}</span></div>
    <label className={styles.field}>{branch ? "Unit name" : "Branch name"}<input maxLength={100} value={name} onChange={event => setName(event.target.value)} aria-invalid={Boolean(error) || undefined} /></label>
    <p className={styles.muted}>{branch ? "Next: appoint its unit leader, then add workers." : "Next: appoint a branch pastor, then unit leaders and workers."}</p>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <footer className={styles.footer}>{branch ? null : <p className={styles.meta} style={{ textAlign: "center" }}>Step 1 of 4 · Next: branch pastor</p>}<button type="button" className={styles.primary} disabled={pending} onClick={save}>{pending ? "Saving…" : branch ? "Add unit" : "Create branch"}<DashboardIcon name="arrow" /></button></footer>
  </section>;
}

/** Paper: Pleros-appoint-branch-pastor (step 2) and Pleros-church-appointment (unit leader). */
export function AppointLeader({ place, role, supervisorId }: { place: ChurchPlace; role: "branch_pastor" | "unit_leader"; supervisorId: string | null }) {
  const router = useRouter(); const [chosen, setChosen] = useState<Person[]>([]); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  const unitName = place.unit?.name;
  function save() {
    const person = chosen[0];
    if (!person) { setError("Choose who to appoint."); return; }
    if (!supervisorId) { setError(role === "unit_leader" ? "Appoint a branch pastor for this branch first." : "Only the Pastor appoints branch pastors."); return; }
    start(async () => {
      const result = await saveChurchAssignment({ userId: person.id, role, branchId: place.branch.id, unitId: role === "unit_leader" ? place.unit!.id : null, supervisorId, ...(role === "branch_pastor" ? { branchIds: [place.branch.id] } : {}) });
      if (!result.ok) { setError(result.error); return; }
      router.push(role === "unit_leader" ? `/dashboard/church/units/${place.unit!.id}/workers` : "/dashboard/church"); router.refresh();
    });
  }
  return <section className={styles.page}>
    <div className={styles.heading}><span className={styles.eyebrow}>{role === "branch_pastor" ? "Church setup" : "Unit appointment"}</span><h1>{role === "branch_pastor" ? "Appoint a branch pastor" : "Appoint a unit leader"}</h1><p>{role === "branch_pastor" ? "Pastor · Manage all branches" : `${place.branch.name} branch only`}</p></div>
    {role === "branch_pastor" ? <SetupSteps step={2} /> : null}
    <div className={styles.panel}><strong>{role === "branch_pastor" ? place.branch.name : `${unitName}`}</strong><span className={styles.meta}>{role === "branch_pastor" ? (place.pastors.length ? `Current: ${place.pastors.map(row => row.name).join(", ")}` : "New branch · No branch pastor yet") : `${place.unit!.workers.length} workers · ${place.unit!.leader ? `Leader: ${place.unit!.leader.name}` : "No leader yet"}`}</span></div>
    <div className={styles.section}><h2>{role === "branch_pastor" ? "Choose a church member" : "Choose unit leader"}</h2><PeopleSearch multiple={false} chosen={chosen} onChange={setChosen} /></div>
    <div className={styles.card}><span className={styles.meta}>Role</span><strong>{role === "branch_pastor" ? "Branch pastor" : "Unit leader"}</strong><span className={styles.meta}>Assigned scope: {role === "branch_pastor" ? `${place.branch.name} only` : `${unitName} · ${place.branch.name}`}</span>
      <span className={styles.meta}>{role === "branch_pastor" ? "Can manage unit leaders and workers in this branch." : "Can view their unit, its direct workers and their own reporting line. Assignments stay with the branch pastor."}</span></div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <footer className={styles.footer}>{role === "branch_pastor" ? <p className={styles.meta} style={{ textAlign: "center" }}>Step 2 of 4 · Next: unit leaders</p> : null}<button type="button" className={styles.primary} disabled={pending || !chosen.length} onClick={save}>{pending ? "Saving…" : role === "branch_pastor" ? "Appoint branch pastor" : "Save appointment"}<DashboardIcon name="check" /></button></footer>
  </section>;
}

/** Paper: Pleros-church-allocation. Workers join one unit under its leader. */
export function AddWorkers({ place }: { place: ChurchPlace }) {
  const router = useRouter(); const [chosen, setChosen] = useState<Person[]>([]); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  const unit = place.unit!;
  function save() {
    if (!chosen.length) { setError("Choose at least one person."); return; }
    start(async () => {
      const result = await addUnitWorkers({ unitId: unit.id, userIds: chosen.map(person => person.id) });
      if (!result.ok) { setError(result.error); return; }
      setChosen([]); router.refresh();
    });
  }
  return <section className={styles.page}>
    <div className={styles.heading}><span className={styles.eyebrow}>Assign workers</span><h1>Add to {unit.name}</h1><p>{place.branch.name} branch only</p></div>
    <div className={styles.panel}><div className={styles.person}><span className={styles.avatar}>{unit.leader ? initials(unit.leader.name) : "—"}</span><div><strong>{unit.name} team</strong><span className={styles.meta}>{unit.leader ? `${unit.leader.name} · Unit leader` : "No leader yet"}</span></div></div><span className={styles.meta}>{unit.workers.length} {unit.workers.length === 1 ? "worker" : "workers"} currently assigned</span></div>
    {unit.leader ? <>
      <div className={styles.section}><h2>Available people</h2><PeopleSearch multiple chosen={chosen} onChange={setChosen} exclude={unit.workers.map(worker => worker.userId)} /></div>
      {unit.workers.length ? <div className={styles.section}><h2>Current workers</h2><ul className={styles.list}>{unit.workers.map(worker => <li key={worker.userId} className={styles.row}><span className={styles.avatar}>{initials(worker.name)}</span><div><strong>{worker.name}</strong><StatusPill tone="green">In {unit.name}</StatusPill></div></li>)}</ul></div> : null}
      {chosen.length ? <p className={styles.muted}>{unit.name} will have {unit.workers.length + chosen.length} workers. Reporting to {unit.leader.name} · {place.branch.name}</p> : null}
    </> : <p className={styles.muted}>Appoint a unit leader first. Workers report to their unit leader.</p>}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {unit.leader ? <footer className={styles.footer}><button type="button" className={styles.primary} disabled={pending || !chosen.length} onClick={save}>{pending ? "Saving…" : `Assign ${chosen.length || ""} ${chosen.length === 1 ? "worker" : "workers"}`.replace("  ", " ")}<DashboardIcon name="check" /></button></footer> : null}
  </section>;
}
