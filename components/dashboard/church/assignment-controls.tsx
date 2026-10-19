"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { addChurchPlace, findChurchMembers, saveChurchAssignment } from "@/app/(site)/dashboard/church/actions";
import { CHURCH_ROLE_LABELS, validChurchParent, type ChurchAssignment, type ChurchRole } from "@/lib/church/permissions";
import styles from "@/components/community/discipleship/discipleship-group.module.css";
import forms from "./church-forms.module.css";

export function AssignmentControls({ viewer, bootstrap, branches, units, roster, multiBranch = false }: {
  viewer: ChurchAssignment | null; bootstrap: boolean; multiBranch?: boolean;
  branches: { id: number; name: string }[]; units: { id: number; branchId: number; name: string }[];
  roster: (ChurchAssignment & { name: string })[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(""); const [candidates, setCandidates] = useState<{ id: string; name: string }[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [userId, setUserId] = useState(""); const [role, setRole] = useState<ChurchRole>(viewer ? "worker" : "pastor");
  const [branch, setBranch] = useState(viewer?.branchId ? String(viewer.branchId) : ""); const [unit, setUnit] = useState(""); const [supervisor, setSupervisor] = useState("");
  const [name, setName] = useState(""); const [message, setMessage] = useState<string | null>(null); const [pending, start] = useTransition();
  // Search as you type, after a short pause (user report, 18 October).
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    let live = true;
    const id = setTimeout(() => { findChurchMembers(term).then(found => { if (live) setCandidates(found); }, () => { if (live) setMessage("Member search is unavailable."); }); }, 250);
    return () => { live = false; clearTimeout(id); };
  }, [query]);
  const branchId = role === "pastor" ? null : Number(branch) || null;
  const unitId = role === "pastor" || role === "branch_pastor" ? null : Number(unit) || null;
  const parents = roster.filter((row) => validChurchParent(role, row, branchId, unitId));
  const roles: ChurchRole[] = viewer?.role === "branch_pastor" ? ["unit_leader", "worker"] : viewer?.role === "pastor" ? ["branch_pastor", "unit_leader", "worker"] : bootstrap ? ["pastor"] : [];
  function perform(task: () => Promise<{ ok: boolean; error?: string }>) { setMessage(null); start(async () => { try { const result = await task(); setMessage(result.ok ? "Saved." : result.error ?? "Could not save."); if (result.ok) { setQuery(""); setCandidates([]); setUserId(""); } if (result.ok) router.refresh(); } catch { setMessage("Could not save. Try again."); } }); }
  return <details className={`${styles.panel} group`}>
    <summary className={`${styles.row} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
      <span className={styles.rowCopy}><span className={styles.rowTitle}>Manage assignments</span><span className={styles.rowMeta}>Appoint people and add branches or units</span></span>
      <ChevronDownIcon className={`${styles.chev} size-4 transition-transform group-open:rotate-180`} strokeWidth={2} aria-hidden="true" />
    </summary>
    <div className="grid gap-4 border-t border-(--color-line) p-3.5">
      <form className="grid gap-2.5" onSubmit={(event) => event.preventDefault()}>
        <label className={forms.field}>Find member<input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setUserId(""); }} maxLength={80} autoComplete="off" placeholder="Start typing a name" /></label>
      </form>
      <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); perform(() => saveChurchAssignment({ userId, role, branchId, unitId, supervisorId: role === "pastor" ? null : supervisor || null, replace: true, ...(role === "branch_pastor" && multiBranch ? { branchIds: selectedBranches } : {}) })); }}>
        <label className={forms.field}>Member<select required value={userId} onChange={(event) => setUserId(event.target.value)}><option value="">Choose member</option>{candidates.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label className={forms.field}>Role<select value={role} onChange={(event) => { setRole(event.target.value as ChurchRole); setSupervisor(""); }}>{roles.map((key) => <option key={key} value={key}>{CHURCH_ROLE_LABELS[key]}</option>)}</select></label>
        {role === "branch_pastor" && multiBranch ? <fieldset className="grid gap-1"><legend className={`${forms.field} mb-1`}>Branches</legend>{branches.map(row => <label key={row.id} className={styles.toggle}><input type="checkbox" checked={selectedBranches.includes(row.id)} onChange={(event) => setSelectedBranches(current => event.target.checked ? [...current, row.id] : current.filter(id => id !== row.id))} />{row.name}</label>)}</fieldset> : role !== "pastor" ? <label className={forms.field}>Branch<select value={branch} required onChange={(event) => { setBranch(event.target.value); setUnit(""); setSupervisor(""); }}><option value="">Choose branch</option>{branches.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label> : null}
        {role === "unit_leader" || role === "worker" ? <label className={forms.field}>Unit<select value={unit} required onChange={(event) => { setUnit(event.target.value); setSupervisor(""); }}><option value="">Choose unit</option>{units.filter((row) => row.branchId === branchId).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label> : null}
        {role !== "pastor" ? <label className={forms.field}>Supervisor<select value={supervisor} required onChange={(event) => setSupervisor(event.target.value)}><option value="">Choose supervisor</option>{parents.map((row) => <option key={row.userId} value={row.userId}>{row.name}</option>)}</select></label> : null}
        <button className={`${styles.btn} ${forms.action} justify-self-start`} data-primary="" disabled={pending}>Save assignment</button>
      </form>
      {viewer?.role === "pastor" || viewer?.role === "branch_pastor" && branchId !== null ? <form className="grid gap-2.5 border-t border-(--color-line) pt-4" onSubmit={(event) => { event.preventDefault(); perform(() => addChurchPlace({ name, branchId: branchId ?? undefined })); }}>
        <label className={forms.field}>{branchId ? "New unit name" : "New branch name"}<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <button className={`${styles.btn} ${forms.tall} justify-self-start`} disabled={pending}>Add {branchId ? "unit" : "branch"}</button>
      </form> : null}
      {message ? <p role="status" className={message === "Saved." ? forms.status : styles.error}>{message}</p> : null}
    </div>
  </details>;
}
