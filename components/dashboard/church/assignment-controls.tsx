"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addChurchPlace, findChurchMembers, saveChurchAssignment } from "@/app/(site)/dashboard/church/actions";
import { CHURCH_ROLE_LABELS, validChurchParent, type ChurchAssignment, type ChurchRole } from "@/lib/church/permissions";
import { compactButton, primaryButton } from "../shell/styles";
import { inputClass, selectClass } from "@/components/community/report/styles";

export function AssignmentControls({ viewer, bootstrap, branches, units, roster }: {
  viewer: ChurchAssignment | null; bootstrap: boolean;
  branches: { id: number; name: string }[]; units: { id: number; branchId: number; name: string }[];
  roster: (ChurchAssignment & { name: string })[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(""); const [candidates, setCandidates] = useState<{ id: string; name: string }[]>([]);
  const [userId, setUserId] = useState(""); const [role, setRole] = useState<ChurchRole>(viewer ? "worker" : "pastor");
  const [branch, setBranch] = useState(viewer?.branchId ? String(viewer.branchId) : ""); const [unit, setUnit] = useState(""); const [supervisor, setSupervisor] = useState("");
  const [name, setName] = useState(""); const [message, setMessage] = useState<string | null>(null); const [pending, start] = useTransition();
  const branchId = role === "pastor" ? null : Number(branch) || null;
  const unitId = role === "pastor" || role === "branch_pastor" ? null : Number(unit) || null;
  const parents = roster.filter((row) => validChurchParent(role, row, branchId, unitId));
  const roles: ChurchRole[] = viewer?.role === "branch_pastor" ? ["unit_leader", "worker"] : viewer?.role === "pastor" ? ["branch_pastor", "unit_leader", "worker"] : bootstrap ? ["pastor"] : [];
  function perform(task: () => Promise<{ ok: boolean; error?: string }>) { setMessage(null); start(async () => { try { const result = await task(); setMessage(result.ok ? "Saved." : result.error ?? "Could not save."); if (result.ok) router.refresh(); } catch { setMessage("Could not save. Try again."); } }); }
  return <details className="rounded-xl border border-(--color-line) bg-white"><summary className="cursor-pointer p-4 text-[15px] font-medium">Manage assignments</summary><div className="grid gap-5 border-t border-(--color-line) p-4">
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); start(async () => { try { setCandidates(await findChurchMembers(query)); setUserId(""); } catch { setMessage("Member search is unavailable."); } }); }}><label className="grid gap-1 text-[13px]">Find member<input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} minLength={2} maxLength={80} required /></label><button className={`${compactButton} w-fit`} disabled={pending}>Search</button></form>
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); perform(() => saveChurchAssignment({ userId, role, branchId, unitId, supervisorId: role === "pastor" ? null : supervisor || null })); }}>
      <label className="grid gap-1 text-[13px]">Member<select className={selectClass} required value={userId} onChange={(event) => setUserId(event.target.value)}><option value="">Choose member</option>{candidates.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label className="grid gap-1 text-[13px]">Role<select className={selectClass} value={role} onChange={(event) => { setRole(event.target.value as ChurchRole); setSupervisor(""); }}>{roles.map((key) => <option key={key} value={key}>{CHURCH_ROLE_LABELS[key]}</option>)}</select></label>
      {role !== "pastor" ? <label className="grid gap-1 text-[13px]">Branch<select className={selectClass} value={branch} required onChange={(event) => { setBranch(event.target.value); setUnit(""); setSupervisor(""); }}><option value="">Choose branch</option>{branches.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label> : null}
      {role === "unit_leader" || role === "worker" ? <label className="grid gap-1 text-[13px]">Unit<select className={selectClass} value={unit} required onChange={(event) => { setUnit(event.target.value); setSupervisor(""); }}><option value="">Choose unit</option>{units.filter((row) => row.branchId === branchId).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label> : null}
      {role !== "pastor" ? <label className="grid gap-1 text-[13px]">Supervisor<select className={selectClass} value={supervisor} required onChange={(event) => setSupervisor(event.target.value)}><option value="">Choose supervisor</option>{parents.map((row) => <option key={row.userId} value={row.userId}>{row.name}</option>)}</select></label> : null}
      <button className={`${primaryButton} w-fit`} disabled={pending}>Save assignment</button>
    </form>
    {viewer?.role === "pastor" || viewer?.role === "branch_pastor" ? <form className="grid gap-3 border-t border-(--color-line) pt-4" onSubmit={(event) => { event.preventDefault(); perform(() => addChurchPlace({ name, branchId: branchId ?? undefined })); }}><label className="grid gap-1 text-[13px]">{branchId ? "New unit name" : "New branch name"}<input className={inputClass} required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label><button className={`${compactButton} w-fit`} disabled={pending}>Add {branchId ? "unit" : "branch"}</button></form> : null}
    {message ? <p role="status" className="text-[13px]">{message}</p> : null}
  </div></details>;
}
