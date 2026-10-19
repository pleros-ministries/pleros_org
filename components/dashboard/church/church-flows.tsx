"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { ArrowRightIcon, CheckIcon, SearchIcon, UserPlusIcon } from "lucide-react";
import { addChurchPlace, addUnitWorkers, findChurchMembers, saveChurchAssignment, saveChurchBranchMembership } from "@/app/(site)/dashboard/church/actions";
import { Initials } from "@/components/community/discipleship/shared";
import type { ChurchPlace } from "@/lib/db/queries/church-home";
import styles from "@/components/community/discipleship/discipleship-group.module.css";
import forms from "./church-forms.module.css";
import { ChurchHeading, ChurchPage } from "./church-ui";
import { Mark, short } from "./oversight-view";

type Person = { id: string; name: string };
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;
const STEPS = ["Branch", "Branch pastor", "Unit leaders", "Workers"];

function SetupSteps({ step }: { step: 1 | 2 | 3 | 4 }) {
  return <div className={forms.steps} aria-label={`Step ${step} of 4`}>
    <div className={forms.bars} aria-hidden="true">{STEPS.map((label, index) => <i key={label} data-on={index < step ? "" : undefined} />)}</div>
    <span className={styles.rowMeta}>Step {step} of 4 · {STEPS[step - 1]} · Next: {STEPS[step]?.toLowerCase()}</span>
  </div>;
}

/** The place being set up, as one Oversight row. */
function PlaceRow({ title, meta, index = 0, end }: { title: string; meta: string; index?: number; end?: ReactNode }) {
  return <div className={styles.panel}><div className={styles.row}>
    <Mark text={short(title)} index={index} />
    <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}</span><span className={styles.rowMeta}>{meta}</span></span>
    {end}
  </div></div>;
}

function Problem({ error }: { error: string | null }) {
  return error ? <p className={styles.error} role="alert">{error}</p> : null;
}

/** Names-only member search (searchChurchCandidates); never contact details. */
function PeopleSearch({ multiple, chosen, onChange, exclude = [], label = "Search church members" }: { multiple: boolean; chosen: Person[]; onChange: (people: Person[]) => void; exclude?: string[]; label?: string }) {
  const [query, setQuery] = useState(""), [results, setResults] = useState<Person[] | null>(null), [error, setError] = useState<string | null>(null), [pending, start] = useTransition();
  // Search as you type, after a short pause (user report, 18 October).
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    let live = true;
    const id = setTimeout(() => start(async () => {
      try { const found = await findChurchMembers(term); if (live) { setResults(found); setError(null); } }
      catch { if (live) setError("Member search is unavailable."); }
    }), 250);
    return () => { live = false; clearTimeout(id); };
  }, [query]);
  const shown = query.trim().length >= 2 ? results : null;
  const picked = new Set(chosen.map(person => person.id));
  const rows = [...chosen, ...(shown ?? []).filter(person => !picked.has(person.id) && !exclude.includes(person.id))];
  return <div className="grid gap-2.5">
    <form className={forms.searchRow} role="search" onSubmit={event => event.preventDefault()}>
      <label className={forms.search}><SearchIcon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" /><span className="sr-only">{label}</span><input type="search" placeholder="Search by name" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" /></label>
    </form>
    {pending ? <span className={styles.rowMeta}>Searching…</span> : null}
    <Problem error={error} />
    {rows.length ? <div className={styles.panel}><ul className={styles.list}>{rows.map(person => {
      const selected = picked.has(person.id);
      return <li key={person.id}><label className={`${styles.row} ${forms.choice}`} data-selected={selected}>
        <Initials name={person.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{person.name}</span><span className={styles.rowMeta}>Church member</span></span>
        <input type={multiple ? "checkbox" : "radio"} name="church-person" checked={selected} onChange={() => { if (multiple) onChange(selected ? chosen.filter(row => row.id !== person.id) : [...chosen, person]); else onChange([person]); if (!selected) setQuery(""); }} />
      </label></li>;
    })}</ul></div> : shown ? <p className={`${styles.panel} ${styles.empty}`}>No members match “{query.trim()}”.</p> : null}
    {multiple && chosen.length ? <span className={styles.rowMeta}>{chosen.length} selected</span> : null}
  </div>;
}

export function PlaceChurchMember({ branches }: { branches: Array<{ id: number; name: string }> }) {
  const [chosen, setChosen] = useState<Person[]>([]);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Bumped after a save so the search box and its results start fresh.
  const [round, setRound] = useState(0);
  function save() {
    const person = chosen[0];
    if (!person || !branchId) { setError("Choose a church member and branch."); return; }
    start(async () => {
      const result = await saveChurchBranchMembership({ userId: person.id, branchId });
      if (!result.ok) { setError(result.error); return; }
      setSaved(`${person.name} was placed in ${branches.find(branch => branch.id === branchId)?.name}.`);
      setChosen([]); setError(null); setRound(value => value + 1);
    });
  }
  return <div className="grid gap-3">
    {/* One descriptive header (user feedback, 18 October): no subtitle or tag. */}
    <h2 className={forms.panelTitle}>Add member to branch</h2>
    <PeopleSearch key={round} multiple={false} chosen={chosen} onChange={value => { setChosen(value); setSaved(null); }} />
    <label className={forms.field}>Branch<select value={branchId} onChange={event => setBranchId(Number(event.target.value))}>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
    <Problem error={error} />
    {saved ? <p className={forms.status} role="status">{saved}</p> : null}
    <div className={forms.footer}><button type="button" className={`${styles.btn} ${forms.action}`} data-primary="" disabled={pending || !chosen.length || !branchId} onClick={save}>{pending ? "Saving…" : "Place in branch"}</button></div>
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
  return <ChurchPage>
    <ChurchHeading title={branch ? "Add a unit" : "Create a branch"} sub={branch ? `${branch.name} branch` : "Fullness of Christ Church"} />
    {branch ? null : <SetupSteps step={1} />}
    <form className={`${styles.panel} ${forms.body}`} onSubmit={event => { event.preventDefault(); save(); }}>
      <label className={forms.field}>{branch ? "Unit name" : "Branch name"}
        <input maxLength={100} value={name} onChange={event => setName(event.target.value)} aria-invalid={Boolean(error) || undefined} placeholder={branch ? "e.g. Ushering" : "e.g. Lekki"} />
        <span className={forms.help}>{branch ? "Units group workers under one unit leader." : "You can rename it later."}</span>
      </label>
      <Problem error={error} />
    </form>
    <div className={forms.footer}>
      <span className={styles.rowMeta}>{branch ? "Next: its unit leader" : "Next: a branch pastor"}</span>
      <button type="button" className={`${styles.btn} ${forms.action}`} data-primary="" disabled={pending} onClick={save}>{pending ? "Saving…" : branch ? "Add unit" : "Create branch"}<ArrowRightIcon className="size-4" strokeWidth={2} aria-hidden="true" /></button>
    </div>
  </ChurchPage>;
}

/** Paper: Pleros-appoint-branch-pastor (step 2) and Pleros-church-appointment (unit leader). */
export function AppointLeader({ place, role, supervisorId }: { place: ChurchPlace; role: "branch_pastor" | "unit_leader"; supervisorId: string | null }) {
  const router = useRouter(); const [chosen, setChosen] = useState<Person[]>([]); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  const unitName = place.unit?.name;
  const pastor = role === "branch_pastor";
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
  return <ChurchPage>
    <ChurchHeading title={pastor ? "Appoint a branch pastor" : "Appoint a unit leader"} sub={pastor ? `${place.branch.name} branch` : `${unitName} · ${place.branch.name} branch`} />
    {pastor ? <SetupSteps step={2} /> : null}
    {pastor
      ? <PlaceRow title={place.branch.name} meta={place.pastors.length ? `Current: ${place.pastors.map(row => row.name).join(", ")}` : "No branch pastor yet"} />
      : <PlaceRow title={unitName!} meta={`${plural(place.unit!.workers.length, "worker")} · ${place.unit!.leader ? `Leader: ${place.unit!.leader.name}` : "No leader yet"}`}
        end={place.unit!.leader ? null : <span className={styles.pill} data-tone="risk">Needs a leader</span>} />}

    <div className={styles.sectionTitle}><h2>{pastor ? "Choose a church member" : "Choose the unit leader"}</h2></div>
    <PeopleSearch multiple={false} chosen={chosen} onChange={setChosen} />

    <div className={styles.sectionTitle}><h2>Role</h2></div>
    <div className={styles.panel}>
      <div className={styles.kv}><span>Role</span><b>{pastor ? "Branch pastor" : "Unit leader"}</b></div>
      <div className={styles.kv}><span>Scope</span><b>{pastor ? `${place.branch.name} only` : `${unitName} · ${place.branch.name}`}</b></div>
    </div>
    <p className={styles.note}>{pastor ? "Can manage unit leaders and workers in this branch." : "Leads their unit: adds its workers, sees their reports and their own reporting line."}</p>

    <Problem error={error} />
    <div className={forms.footer}>
      {pastor ? <span className={styles.rowMeta}>Next: unit leaders</span> : null}
      <button type="button" className={`${styles.btn} ${forms.action}`} data-primary="" disabled={pending || !chosen.length} onClick={save}>{pending ? "Saving…" : pastor ? "Appoint branch pastor" : "Save appointment"}<CheckIcon className="size-4" strokeWidth={2.2} aria-hidden="true" /></button>
    </div>
  </ChurchPage>;
}

/** Paper: Pleros-church-allocation. Workers join one unit under its leader. */
export function AddWorkers({ place }: { place: ChurchPlace }) {
  const router = useRouter(); const [chosen, setChosen] = useState<Person[]>([]); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  const [round, setRound] = useState(0);
  const unit = place.unit!;
  function save() {
    if (!chosen.length) { setError("Choose at least one person."); return; }
    start(async () => {
      const result = await addUnitWorkers({ unitId: unit.id, userIds: chosen.map(person => person.id) });
      if (!result.ok) { setError(result.error); return; }
      setChosen([]); setRound(value => value + 1); router.refresh();
    });
  }
  return <ChurchPage>
    <ChurchHeading title={`${unit.name} workers`} sub={`${place.branch.name} branch`} />
    <PlaceRow title={unit.name} meta={unit.leader ? `${unit.leader.name} · Unit leader` : "No leader yet"}
      end={<span className={styles.pill} data-tone={unit.leader ? undefined : "risk"}>{unit.leader ? plural(unit.workers.length, "worker") : "Needs a leader"}</span>} />
    {unit.leader ? <>
      <div className={styles.sectionTitle}><h2>Add people</h2></div>
      <PeopleSearch key={round} multiple chosen={chosen} onChange={setChosen} exclude={unit.workers.map(worker => worker.userId)} />
      {chosen.length ? <p className={styles.note}>{unit.name} will have {plural(unit.workers.length + chosen.length, "worker")}, reporting to {unit.leader.name}.</p> : null}
      <Problem error={error} />
      <div className={forms.footer}>
        <button type="button" className={`${styles.btn} ${forms.action}`} data-primary="" disabled={pending || !chosen.length} onClick={save}>{pending ? "Saving…" : chosen.length ? `Assign ${plural(chosen.length, "worker")}` : "Assign workers"}<CheckIcon className="size-4" strokeWidth={2.2} aria-hidden="true" /></button>
      </div>
      <div className={styles.sectionTitle}><h2>Current workers</h2><span className={styles.rowMeta}>{unit.workers.length}</span></div>
      {unit.workers.length ? <div className={styles.panel}><ul className={styles.list}>{unit.workers.map(worker => <li key={worker.userId} className={styles.row}>
        <Initials name={worker.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{worker.name}</span><span className={styles.rowMeta}>Worker · reports to {unit.leader!.name}</span></span>
      </li>)}</ul></div> : <p className={`${styles.panel} ${styles.empty}`}>No workers in {unit.name} yet.</p>}
    </> : <>
      <p className={`${styles.panel} ${styles.empty}`}>Appoint a unit leader first. Workers report to their unit leader.</p>
      <Link href={`/dashboard/church/units/${unit.id}/leader`} className={`${styles.quiet} inline-flex items-center gap-1`}><UserPlusIcon className="size-3.5" strokeWidth={2.2} />Appoint a unit leader</Link>
      <Problem error={error} />
    </>}
  </ChurchPage>;
}
