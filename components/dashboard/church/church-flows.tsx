"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { ArrowRightIcon, ArrowRightLeftIcon, CheckIcon, ChevronDownIcon, PencilIcon, SearchIcon, UserMinusIcon, UserPlusIcon } from "lucide-react";
import { addChurchPlace, addUnitWorkers, changeUnitLeader, findChurchMembers, moveUnitWorker, removeUnitWorker, renameChurchPlaceAction, saveChurchAssignment, saveChurchBranchMembership } from "@/app/(site)/dashboard/church/actions";
import { ActionMenu } from "@/components/community/action-menu";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import type { ChurchCandidate } from "@/lib/db/queries/church-organisation";
import { Initials } from "@/components/community/discipleship/shared";
import type { ChurchPlace } from "@/lib/db/queries/church-home";
import styles from "@/components/community/discipleship/discipleship-group.module.css";
import forms from "./church-forms.module.css";
import { ChurchHeading, ChurchPage } from "./church-ui";
import { Mark, short } from "./oversight-view";

type Person = ChurchCandidate;

/** What a person does now, shown in the picker so a save never replaces it unseen. */
function currentRole(person: Person): string {
  const held = person.current;
  if (!held) return "Church member";
  if (held.role === "pastor") return "Pastor";
  if (held.role === "branch_pastor") return `Branch pastor${held.branchName ? ` · ${held.branchName}` : ""}`;
  return `${held.role === "unit_leader" ? "Leads" : "Worker in"} ${held.unitName ?? "a unit"}`;
}
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
function PeopleSearch({ multiple, chosen, onChange, exclude = [], label = "Search church members", blocked }: { multiple: boolean; chosen: Person[]; onChange: (people: Person[]) => void; exclude?: string[]; label?: string; blocked?: (person: Person) => string | null }) {
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
      const reason = selected ? null : blocked?.(person) ?? null;
      return <li key={person.id}><label className={`${styles.row} ${forms.choice}`} data-selected={selected} aria-disabled={reason ? true : undefined} style={reason ? { opacity: 0.6 } : undefined}>
        <Initials name={person.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{person.name}</span><span className={styles.rowMeta}>{reason ?? currentRole(person)}</span></span>
        <input type={multiple ? "checkbox" : "radio"} name="church-person" checked={selected} disabled={Boolean(reason)} onChange={() => { if (multiple) onChange(selected ? chosen.filter(row => row.id !== person.id) : [...chosen, person]); else onChange([person]); if (!selected) setQuery(""); }} />
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
export function CreatePlace({ branch, unitsRetired = false }: { branch?: { id: number; name: string };
  /** Groups as oversight: no unit-leader or worker steps follow a branch. */
  unitsRetired?: boolean }) {
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
    {branch || unitsRetired ? null : <SetupSteps step={1} />}
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
export function AppointLeader({ place, role, supervisorId, moveTargets = [], unitsRetired = false }: { place: ChurchPlace; role: "branch_pastor" | "unit_leader"; supervisorId: string | null; moveTargets?: MoveTarget[];
  /** Groups as oversight: a branch pastor is the last step; units are retired. */
  unitsRetired?: boolean }) {
  const router = useRouter(); const [chosen, setChosen] = useState<Person[]>([]); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  const unitName = place.unit?.name;
  const pastor = role === "branch_pastor";
  // A unit that already has a leader gets a handover, not a second leader (user request, 19 October).
  const current = pastor ? null : place.unit?.leader ?? null;
  const replacing = Boolean(current);
  // Where the previous leader goes: "stay", "remove" or another unit's id (user request, 19 October).
  const [oldTo, setOldTo] = useState("");
  const [confirmMove, setConfirmMove] = useState(false);
  const held = chosen[0]?.current;
  const movingLeader = !pastor && !replacing && held?.role === "unit_leader" && held.unitId !== place.unit?.id;
  const movingWorker = !pastor && !replacing && held?.role === "worker" && held.unitId !== place.unit?.id;
  const otherUnits = moveTargets.filter(unit => unit.id !== place.unit?.id && unit.leaderId);
  const oldBranches = [...new Set(otherUnits.map(unit => unit.branchName))];
  function save() {
    const person = chosen[0];
    if (!person) { setError("Choose who to appoint."); return; }
    if (movingLeader && !confirmMove) { setError(`Confirm moving ${person.name.split(" ")[0]} from ${held!.unitName ?? "their unit"}.`); return; }
    if (replacing && !oldTo) { setError(`Choose where ${current!.name.split(" ")[0]} goes next.`); return; }
    if (!supervisorId && !replacing) { setError(role === "unit_leader" ? "Appoint a branch pastor for this branch first." : "Only the Pastor appoints branch pastors."); return; }
    start(async () => {
      const result = replacing
        ? await changeUnitLeader({ unitId: place.unit!.id, userId: person.id, supervisorId, oldLeader: oldTo === "stay" || oldTo === "remove" ? { kind: oldTo } : { kind: "unit", unitId: Number(oldTo) } })
        : await saveChurchAssignment({ userId: person.id, role, branchId: place.branch.id, unitId: role === "unit_leader" ? place.unit!.id : null, supervisorId, replace: movingLeader && confirmMove, ...(role === "branch_pastor" ? { branchIds: [place.branch.id] } : {}) });
      if (!result.ok) { setError(result.error); return; }
      router.push(role === "unit_leader" ? `/dashboard/church/units/${place.unit!.id}/workers` : "/dashboard/church"); router.refresh();
    });
  }
  return <ChurchPage>
    {place.unit && !pastor ? <CrumbLabel href={`/dashboard/church/units/${place.unit.id}/leader`} label={`${place.unit.name} leader`} /> : null}
    <ChurchHeading title={pastor ? "Appoint a branch pastor" : replacing ? "Change unit leader" : "Appoint a unit leader"} sub={pastor ? `${place.branch.name} branch` : `${unitName} · ${place.branch.name} branch`} />
    {pastor && !unitsRetired ? <SetupSteps step={2} /> : null}
    {pastor
      ? <PlaceRow title={place.branch.name} meta={place.pastors.length ? `Current: ${place.pastors.map(row => row.name).join(", ")}` : "No branch pastor yet"} />
      : <PlaceRow title={unitName!} meta={`${plural(place.unit!.workers.length, "worker")} · ${place.unit!.leader ? `Leader: ${place.unit!.leader.name}` : "No leader yet"}`}
        end={place.unit!.leader ? null : <span className={styles.pill} data-tone="risk">Needs a leader</span>} />}

    <div className={styles.sectionTitle}><h2>{pastor ? "Choose a church member" : replacing ? "Choose the new unit leader" : "Choose the unit leader"}</h2></div>
    <PeopleSearch multiple={false} chosen={chosen} onChange={value => { setChosen(value); setConfirmMove(false); }} exclude={current ? [current.userId] : []} blocked={person => {
      const held = person.current;
      if (!held || (held.role === "worker" && held.unitId === place.unit?.id)) return null;
      if (held.role === "pastor" || held.role === "branch_pastor") return `${currentRole(person)} · cannot lead a unit`;
      // A handover moves only people without another appointment; appointing can move a leader once confirmed.
      if (replacing) return `${currentRole(person)} · move them first`;
      return null;
    }} />
    {movingLeader ? <label className="flex items-start gap-2.5 text-[13px] leading-[19px]">
      <input type="checkbox" className="mt-0.5" checked={confirmMove} onChange={event => setConfirmMove(event.target.checked)} />
      <span>{chosen[0]!.name.split(" ")[0]} leads {chosen[0]!.current!.unitName ?? "another unit"} now. Move them here and leave {chosen[0]!.current!.unitName ?? "that unit"} without a leader.</span>
    </label> : movingWorker ? <p className={styles.note}>{chosen[0]!.name.split(" ")[0]} leaves {chosen[0]!.current!.unitName ?? "their unit"} to lead {unitName}.</p> : null}

    {current ? <>
      <div className={styles.sectionTitle}><h2>Where does {current.name.split(" ")[0]} go?</h2></div>
      <label className={forms.field}><span className="sr-only">Where {current.name} goes</span><select value={oldTo} onChange={event => setOldTo(event.target.value)} disabled={pending}>
        <option value="" disabled>Choose where</option>
        {oldBranches.map(branch => <optgroup key={branch} label={branch}>{otherUnits.filter(unit => unit.branchName === branch).map(unit => <option key={unit.id} value={String(unit.id)}>Move to {unit.name}</option>)}</optgroup>)}
        <optgroup label="Other"><option value="stay">Stay in {unitName} as a worker</option><option value="remove">Leave the unit (stays a church member)</option></optgroup>
      </select></label>
    </> : null}
    <div className={styles.sectionTitle}><h2>Role</h2></div>
    <div className={styles.panel}>
      <div className={styles.kv}><span>Role</span><b>{pastor ? "Branch pastor" : "Unit leader"}</b></div>
      <div className={styles.kv}><span>Scope</span><b>{pastor ? `${place.branch.name} only` : `${unitName} · ${place.branch.name}`}</b></div>
    </div>
    <p className={styles.note}>{pastor ? unitsRetired ? "Sees reports from everyone placed in this branch, alongside their own groups." : "Can manage unit leaders and workers in this branch." : current ? `Leads ${unitName} from now on, and its workers report to them.` : "Leads their unit: adds its workers, sees their reports and their own reporting line."}</p>

    <Problem error={error} />
    <div className={forms.footer}>
      {pastor && !unitsRetired ? <span className={styles.rowMeta}>Next: unit leaders</span> : null}
      <button type="button" className={`${styles.btn} ${forms.action}`} data-primary="" disabled={pending || !chosen.length} onClick={save}>{pending ? "Saving…" : pastor ? "Appoint branch pastor" : replacing ? "Change leader" : "Save appointment"}<CheckIcon className="size-4" strokeWidth={2.2} aria-hidden="true" /></button>
    </div>
  </ChurchPage>;
}

/** Paper: Pleros-church-allocation. Workers join one unit under its leader. */
/** Inline rename for a branch or unit (user request, 19 October). */
function RenameForm({ kind, id, name, onClose }: { kind: "branch" | "unit"; id: number; name: string; onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState(name), [error, setError] = useState<string | null>(null), [pending, start] = useTransition();
  function save() {
    const next = value.trim();
    if (!next) { setError("Enter a name."); return; }
    if (next === name) { onClose(); return; }
    start(async () => {
      const result = await renameChurchPlaceAction({ kind, id, name: next });
      if (!result.ok) { setError(result.error); return; }
      onClose(); router.refresh();
    });
  }
  return <form className="grid basis-full gap-2.5" onSubmit={event => { event.preventDefault(); save(); }}>
    <label className={forms.field}>{kind === "branch" ? "Branch name" : "Unit name"}<input value={value} onChange={event => setValue(event.target.value)} maxLength={100} autoFocus disabled={pending} aria-invalid={error ? true : undefined} /></label>
    <Problem error={error} />
    <div className="flex gap-2"><button type="submit" className={styles.btn} data-primary="" disabled={pending}>{pending ? "Saving…" : "Save name"}</button><button type="button" className={styles.btn} disabled={pending} onClick={onClose}>Cancel</button></div>
  </form>;
}

/** Inline rename for a branch or unit (user request, 19 October). */
export function RenamePlace({ kind, id, name }: { kind: "branch" | "unit"; id: number; name: string }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <RenameForm kind={kind} id={id} name={name} onClose={() => setEditing(false)} />;
  return <button type="button" className={`${styles.quiet} inline-flex items-center gap-1`} onClick={() => setEditing(true)}><PencilIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />Rename</button>;
}

type MoveTarget = { id: number; name: string; branchId: number; branchName: string; leaderId: string | null };

/**
 * The unit's name is its own switcher, with rename beside it, so the page
 * opens without extra rows of controls (user feedback, 19 October). A native
 * select sits over the name, so phones get their own picker.
 */
function UnitTitle({ unit, branchName, units, canManage }: { unit: { id: number; name: string }; branchName: string; units: MoveTarget[]; canManage: boolean }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  if (renaming) return <RenameForm key={unit.name} kind="unit" id={unit.id} name={unit.name} onClose={() => setRenaming(false)} />;
  const switchable = canManage && units.length > 1;
  const branches = [...new Set(units.map(row => row.branchName))];
  return <div className={styles.heading}><div className="min-w-0">
    <div className="flex min-w-0 items-center gap-1">
      <span className="relative inline-flex min-w-0 items-center gap-1">
        <h1 className="truncate">{unit.name}</h1>
        {switchable ? <>
          <ChevronDownIcon className="size-5 shrink-0 text-(--color-community-blue)" strokeWidth={2.2} aria-hidden="true" />
          <select aria-label="Switch unit" className="absolute inset-0 cursor-pointer opacity-0" value={unit.id} onChange={event => router.push(`/dashboard/church/units/${event.target.value}/workers`)}>
            {branches.map(branch => <optgroup key={branch} label={branch}>{units.filter(row => row.branchName === branch).map(row => <option key={row.id} value={row.id}>{row.name}{row.leaderId ? "" : " · needs a leader"}</option>)}</optgroup>)}
          </select>
        </> : null}
      </span>
      {canManage ? <button type="button" aria-label={`Rename ${unit.name}`} title="Rename" onClick={() => setRenaming(true)} className="grid size-8 shrink-0 place-items-center rounded-full text-(--color-community-muted) hover:bg-(--color-community-canvas) hover:text-(--color-community-ink)"><PencilIcon className="size-4" strokeWidth={2} aria-hidden="true" /></button> : null}
    </div>
    <p className={styles.sub}>{branchName} branch</p>
  </div></div>;
}

/** Move a worker to another unit or take them out of this one (Pastors and Branch Pastors, user request 19 October). */
function WorkerTools({ worker, unitId, targets, onDone }: { worker: { userId: string; name: string }; unitId: number; targets: MoveTarget[]; onDone: (message: string) => void }) {
  const [mode, setMode] = useState<"move" | "remove" | null>(null);
  const [to, setTo] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const first = worker.name.split(" ")[0];
  const options = targets.filter(unit => unit.id !== unitId);
  const branches = [...new Set(options.map(unit => unit.branchName))];
  function run(task: () => Promise<{ ok: boolean; error?: string; unitName?: string }>, done: (unitName?: string) => string) {
    setError(null);
    start(async () => {
      const result = await task();
      if (!result.ok) { setError(result.error ?? "Could not save."); return; }
      setMode(null); onDone(done(result.unitName));
    });
  }
  return <>
    <ActionMenu label={`Manage ${worker.name}`} trigger="Manage" actions={[
      ...(options.length ? [{ key: "move", label: "Move to another unit", icon: ArrowRightLeftIcon, onSelect: () => { setMode("move"); setTo(0); } }] : []),
      { key: "remove", label: "Remove from unit", icon: UserMinusIcon, danger: true, onSelect: () => setMode("remove") },
    ]} />
    {mode ? <div className="grid basis-full gap-2.5 border-t border-[var(--dashboard-panel-edge,#e2e5ea)] pt-3">
      {mode === "move" ? <>
        <label className={forms.field}>Move {first} to<select value={to} onChange={event => setTo(Number(event.target.value))} disabled={pending}>
          <option value={0} disabled>Choose a unit</option>
          {branches.map(branch => <optgroup key={branch} label={branch}>{options.filter(unit => unit.branchName === branch).map(unit => <option key={unit.id} value={unit.id} disabled={!unit.leaderId}>{unit.name}{unit.leaderId ? "" : " (no leader yet)"}</option>)}</optgroup>)}
        </select></label>
        <p className={styles.rowMeta}>{first} will report to that unit’s leader.</p>
        <div className="flex gap-2"><button type="button" className={styles.btn} data-primary="" disabled={pending || !to} onClick={() => run(() => moveUnitWorker({ userId: worker.userId, unitId: to }), unitName => `${first} moved to ${unitName ?? "the new unit"}.`)}>{pending ? "Moving…" : `Move ${first}`}</button><button type="button" className={styles.btn} disabled={pending} onClick={() => setMode(null)}>Cancel</button></div>
      </> : <>
        <p className="m-0 text-[13px]">Remove {first} from this unit? They stay a church member and can be added to a unit again later.</p>
        <div className="flex gap-2"><button type="button" className={`${styles.btn} border-red-200 text-red-700`} disabled={pending} onClick={() => run(() => removeUnitWorker({ userId: worker.userId }), () => `${first} was removed from the unit.`)}>{pending ? "Removing…" : `Remove ${first}`}</button><button type="button" className={styles.btn} disabled={pending} onClick={() => setMode(null)}>Cancel</button></div>
      </>}
      <Problem error={error} />
    </div> : null}
  </>;
}

export function AddWorkers({ place, moveTargets = [] }: { place: ChurchPlace; moveTargets?: MoveTarget[] }) {
  const router = useRouter(); const [chosen, setChosen] = useState<Person[]>([]); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  const [round, setRound] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const canManage = place.viewerRole === "pastor" || place.viewerRole === "branch_pastor";
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
    <CrumbLabel href={`/dashboard/church/units/${unit.id}/workers`} label={unit.name} />
    <UnitTitle unit={unit} branchName={place.branch.name} units={moveTargets} canManage={canManage} />
    {/* Facts, not a destination: the leader as a plain row; Current workers carries the count (user feedback, 19 October). */}
    <div className={styles.panel}>
      <div className={`${styles.kv} items-center`}><span>Unit leader</span><span className="flex min-w-0 items-center gap-3">
        <b className="truncate">{unit.leader?.name ?? "No leader yet"}</b>
        {canManage ? <Link href={`/dashboard/church/units/${unit.id}/leader`} className={styles.quiet}>{unit.leader ? "Change" : "Appoint"}</Link> : null}
      </span></div>
    </div>
    {unit.leader ? <>
      <div className={styles.sectionTitle}><h2>Add people</h2></div>
      <PeopleSearch key={round} multiple chosen={chosen} onChange={setChosen} exclude={unit.workers.map(worker => worker.userId)} blocked={person => {
        const held = person.current;
        if (!held || held.role === "worker") return null;
        // Adding a leader as a worker would leave their unit without a leader.
        return held.role === "unit_leader" ? `Already leads ${held.unitName ?? "another unit"}` : `${currentRole(person)} · cannot be a worker`;
      }} />
      {chosen.length ? <p className={styles.note}>{unit.name} will have {plural(unit.workers.length + chosen.length, "worker")}, reporting to {unit.leader.name}.{(() => {
        const moving = chosen.filter(person => person.current?.role === "worker" && person.current.unitId !== unit.id);
        return moving.length ? ` ${moving.map(person => `${person.name.split(" ")[0]} moves from ${person.current!.unitName ?? "another unit"}`).join(", ")}.` : "";
      })()}</p> : null}
      <Problem error={error} />
      <div className={forms.footer}>
        <button type="button" className={`${styles.btn} ${forms.action}`} data-primary="" disabled={pending || !chosen.length} onClick={save}>{pending ? "Saving…" : chosen.length ? `Assign ${plural(chosen.length, "worker")}` : "Assign workers"}<CheckIcon className="size-4" strokeWidth={2.2} aria-hidden="true" /></button>
      </div>
      <div className={styles.sectionTitle}><h2>Current workers</h2><span className={styles.rowMeta}>{unit.workers.length}</span></div>
      {notice ? <p className={forms.status} role="status">{notice}</p> : null}
      {unit.workers.length ? <div className={styles.panel}><ul className={styles.list}>{unit.workers.map(worker => <li key={worker.userId} className={`${styles.row} flex-wrap`}>
        <Initials name={worker.name} />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{worker.name}</span><span className={styles.rowMeta}>Worker · reports to {unit.leader!.name}</span></span>
        {canManage ? <WorkerTools worker={worker} unitId={unit.id} targets={moveTargets} onDone={message => { setNotice(message); router.refresh(); }} /> : null}
      </li>)}</ul></div> : <p className={`${styles.panel} ${styles.empty}`}>No workers in {unit.name} yet.</p>}
    </> : <>
      <p className={`${styles.panel} ${styles.empty}`}>Appoint a unit leader first. Workers report to their unit leader.</p>
      <Link href={`/dashboard/church/units/${unit.id}/leader`} className={`${styles.quiet} inline-flex items-center gap-1`}><UserPlusIcon className="size-3.5" strokeWidth={2.2} />Appoint a unit leader</Link>
      <Problem error={error} />
    </>}
  </ChurchPage>;
}
