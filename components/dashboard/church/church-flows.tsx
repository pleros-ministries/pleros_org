"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { ArrowRightIcon, CheckIcon, PencilIcon, SearchIcon } from "lucide-react";
import { addChurchPlace, findChurchMembers, renameChurchPlaceAction, saveChurchAssignment, saveChurchBranchMembership } from "@/app/(site)/dashboard/church/actions";
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
/** Creates a branch; its branch pastor is appointed next. Units are retired (groups as oversight, 19 October). */
export function CreatePlace() {
  const router = useRouter(); const [name, setName] = useState(""); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  function save() {
    if (!name.trim()) { setError("Enter the branch name."); return; }
    start(async () => {
      const result = await addChurchPlace({ name });
      if (!result.ok) { setError(result.error); return; }
      router.push(`/dashboard/church/branches/${result.id}/pastor`); router.refresh();
    });
  }
  return <ChurchPage>
    <ChurchHeading title="Create a branch" sub="Fullness of Christ Church" />
    <form className={`${styles.panel} ${forms.body}`} onSubmit={event => { event.preventDefault(); save(); }}>
      <label className={forms.field}>Branch name
        <input maxLength={100} value={name} onChange={event => setName(event.target.value)} aria-invalid={Boolean(error) || undefined} placeholder="e.g. Lekki" />
        <span className={forms.help}>You can rename it later.</span>
      </label>
      <Problem error={error} />
    </form>
    <div className={forms.footer}>
      <span className={styles.rowMeta}>Next: a branch pastor</span>
      <button type="button" className={`${styles.btn} ${forms.action}`} data-primary="" disabled={pending} onClick={save}>{pending ? "Saving…" : "Create branch"}<ArrowRightIcon className="size-4" strokeWidth={2} aria-hidden="true" /></button>
    </div>
  </ChurchPage>;
}

/** The Pastor appoints a branch's pastor (Paper: Pleros-appoint-branch-pastor). */
export function AppointBranchPastor({ place, supervisorId }: { place: ChurchPlace; supervisorId: string | null }) {
  const router = useRouter(); const [chosen, setChosen] = useState<Person[]>([]); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  function save() {
    const person = chosen[0];
    if (!person) { setError("Choose who to appoint."); return; }
    if (!supervisorId) { setError("Only the Pastor appoints branch pastors."); return; }
    // A unit appointment left over from the retired org chart is replaced on purpose.
    const legacy = person.current?.role === "unit_leader" || person.current?.role === "worker";
    start(async () => {
      const result = await saveChurchAssignment({ userId: person.id, role: "branch_pastor", branchId: place.branch.id, unitId: null, supervisorId, replace: legacy, branchIds: [place.branch.id] });
      if (!result.ok) { setError(result.error); return; }
      router.push("/dashboard/community/oversight/structure"); router.refresh();
    });
  }
  return <ChurchPage>
    <ChurchHeading title="Appoint a branch pastor" sub={`${place.branch.name} branch`} />
    <PlaceRow title={place.branch.name} meta={place.pastors.length ? `Current: ${place.pastors.map(row => row.name).join(", ")}` : "No branch pastor yet"} />
    <div className={styles.sectionTitle}><h2>Choose a church member</h2></div>
    <PeopleSearch multiple={false} chosen={chosen} onChange={setChosen} blocked={person => person.current?.role === "pastor" ? "Pastor · cannot be a branch pastor" : person.current?.role === "branch_pastor" ? `${currentRole(person)} already` : null} />
    <div className={styles.sectionTitle}><h2>Role</h2></div>
    <div className={styles.panel}>
      <div className={styles.kv}><span>Role</span><b>Branch pastor</b></div>
      <div className={styles.kv}><span>Scope</span><b>{place.branch.name} only</b></div>
    </div>
    <p className={styles.note}>Sees reports from everyone placed in this branch, alongside their own groups.</p>
    <Problem error={error} />
    <div className={forms.footer}>
      <button type="button" className={`${styles.btn} ${forms.action}`} data-primary="" disabled={pending || !chosen.length} onClick={save}>{pending ? "Saving…" : "Appoint branch pastor"}<CheckIcon className="size-4" strokeWidth={2.2} aria-hidden="true" /></button>
    </div>
  </ChurchPage>;
}

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
