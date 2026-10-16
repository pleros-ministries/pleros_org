"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeEnrolleeOwner, searchFollowUpOwners } from "@/app/_actions/sogp-follow-up-actions";
import type { CoordinatorEnrollee, CoordinatorRow } from "@/lib/db/queries/sogp-coordinator";
import type { FollowUpOwnerCandidate } from "@/lib/db/queries/sogp-follow-up-requests";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");
const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short" });
const stamp = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
const sourceText = (row: CoordinatorRow) => row.source === "code" ? "Referral code" : row.source === "link" ? "Referral link" : row.source === "geography" ? `Direct join${row.region ? ` · ${row.region}` : ""}` : row.region || "Enrolled";
const pill = (tone: "green" | "amber" | "neutral", text: string) => <span className={`inline-flex h-[26px] items-center rounded-full px-2.5 text-[12px] font-medium ${tone === "green" ? "bg-[var(--color-community-mint-soft)] text-[var(--color-community-mint-ink)]" : tone === "amber" ? "bg-[var(--color-community-amber-soft)] text-[var(--color-community-amber-ink)]" : "bg-zinc-100 text-zinc-600"}`}>{text}</span>;

/** Paper: Pleros-control-centre (coordinator · all enrollees). */
export function CoordinatorControlCentre({ rows }: { rows: CoordinatorRow[] }) {
  const [filter, setFilter] = useState<"all" | "unassigned" | "assigned" | "requests">("all");
  const [query, setQuery] = useState(""), [cohort, setCohort] = useState("");
  const cohorts = [...new Set(rows.map(row => row.cohortTitle))];
  const needle = query.trim().toLowerCase();
  const visible = rows.filter(row => (filter === "all" || filter === "unassigned" && !row.ownerId || filter === "assigned" && row.ownerId || filter === "requests" && row.requested)
    && (!cohort || row.cohortTitle === cohort) && (!needle || `${row.name} ${row.ownerName ?? ""} ${row.region}`.toLowerCase().includes(needle)));
  const requests = rows.filter(row => row.requested).length;
  return <section className="mx-auto grid w-full max-w-160 gap-5">
    <header className="grid gap-1"><p className="text-[12px] font-medium tracking-[.04em] text-(--color-text-muted) uppercase">Coordinator · All enrollees</p><h1 className="text-[24px] leading-8 font-medium">Control centre</h1></header>
    <div className="grid grid-cols-3 rounded-[16px] bg-(--color-surface-muted) p-4">{([["Enrollees", rows.length], ["Assigned", rows.filter(row => row.ownerId).length], ["Requests", requests]] as const).map(([label, value], index) => <div key={label} className={`grid gap-0.5 ${index ? "border-l border-(--color-line) pl-3" : ""}`}><strong className="text-[24px] leading-8 font-medium">{value}</strong><span className="text-[13px] text-(--color-text-muted)">{label}</span></div>)}</div>
    <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find an enrollee" aria-label="Find an enrollee" className="min-h-11 rounded-[11px] bg-(--color-surface-muted) px-4 text-[16px]" />
    <div className="flex flex-wrap gap-2">{([["all", "All"], ["unassigned", "Unassigned"], ["assigned", "Assigned"], ["requests", `Requests · ${requests}`]] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`min-h-8 rounded-full px-3 text-[13px] ${filter === key ? "bg-[var(--color-community-sky-soft)] font-medium text-[var(--color-community-sky-ink)]" : "bg-(--color-surface-muted)"}`}>{label}</button>)}</div>
    {cohorts.length > 1 ? <select aria-label="Cohort" value={cohort} onChange={event => setCohort(event.target.value)} className="min-h-11 rounded-[11px] border border-(--color-line) bg-white px-3 text-[14px]"><option value="">All cohorts</option>{cohorts.map(title => <option key={title}>{title}</option>)}</select> : null}
    <p className="text-[13px] text-(--color-text-muted)">{visible.length} shown · Recent first</p>
    <ul className="grid">{visible.slice(0, 300).map(row => <li key={row.enrollmentId}><Link href={`/admin/follow-up/${row.enrollmentId}`} className="flex items-start gap-3 border-b border-(--color-line) py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-(--status-green-bg) text-[12px] text-(--status-green-text)">{initials(row.name)}</span>
      <span className="grid min-w-0 flex-1 gap-1"><span className="flex items-center justify-between gap-3"><strong className="text-[14px] font-medium">{row.name}</strong>{row.requested ? pill("amber", "Requested change") : row.ownerId ? pill("green", "Assigned") : pill("neutral", "Unassigned")}</span>
        <span className="text-[13px] text-(--color-text-muted)">{sourceText(row)} · {day.format(new Date(row.createdAt))}</span>
        <span className="text-[13px] text-(--color-text-muted)">{row.ownerName ? `Owner: ${row.ownerName}` : "No follow-up owner yet"}</span></span>
    </Link></li>)}</ul>
    {!visible.length ? <p className="text-[13px] text-(--color-text-muted)">No enrollees match.</p> : null}
  </section>;
}

/** Paper: Pleros-enrollee-details + Pleros-change-owner (coordinator). */
export function CoordinatorEnrolleeDetails({ data, people }: { data: CoordinatorEnrollee; people: FollowUpOwnerCandidate[] }) {
  const router = useRouter();
  const [changing, setChanging] = useState(false), [person, setPerson] = useState<FollowUpOwnerCandidate | null>(null);
  const [query, setQuery] = useState(""), [results, setResults] = useState<FollowUpOwnerCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null), [pending, start] = useTransition();
  const choices = (results ?? people).filter(item => item.id !== data.ownerId);
  return <section className="mx-auto grid w-full max-w-160 gap-6">
    <div className="grid justify-items-center gap-2 text-center"><span className="grid size-14 place-items-center rounded-full bg-(--status-green-bg) text-[14px] text-(--status-green-text)">{initials(data.name)}</span><h1 className="text-[24px] leading-8 font-medium">{data.name}</h1><p className="text-[13px] text-(--color-text-muted)">SOGP · {data.cohortTitle}</p>{data.pendingRequest ? pill("amber", "Reassignment requested") : null}</div>
    {data.pendingRequest ? <blockquote className="rounded-[12px] bg-(--color-surface-muted) p-4 text-[14px] whitespace-pre-wrap break-words">“{data.pendingRequest.reason}”<span className="mt-2 block text-[12px] text-(--color-text-muted)">Requested {stamp.format(new Date(data.pendingRequest.createdAt))}</span></blockquote> : null}
    <div className="grid gap-3"><h2 className="text-[15px] font-medium">Follow-up owner</h2><div className="flex items-center gap-3 rounded-[12px] border border-(--color-line) p-4"><span className="grid size-9 place-items-center rounded-full bg-(--status-blue-bg) text-[12px] text-(--color-brand-blue)">{data.ownerName ? initials(data.ownerName) : "—"}</span><span className="grid flex-1"><strong className="text-[14px] font-medium">{data.ownerName ?? "Unassigned"}</strong><span className="text-[13px] text-(--color-text-muted)">{data.sourceLabel ?? "No follow-up owner yet"}</span></span>{data.pendingRequest ? <Link href="/admin/follow-up-requests" className="text-[14px] font-medium text-(--color-brand-blue)">Review request</Link> : <button type="button" onClick={() => setChanging(value => !value)} className="text-[14px] font-medium text-(--color-brand-blue)">Change owner</button>}</div></div>
    {changing && !data.pendingRequest ? <div className="grid gap-3 rounded-[16px] border border-(--color-line) p-4">
      <h2 className="text-[15px] font-medium">Choose someone to help</h2>
      <form className="flex gap-2" onSubmit={event => { event.preventDefault(); start(async () => { const result = await searchFollowUpOwners(query); if (result.ok) setResults(result.value); else setError(result.error); }); }}><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search follow-up owners or enrollees" aria-label="Search follow-up owners" className="min-h-11 flex-1 rounded-[11px] bg-(--color-surface-muted) px-4 text-[16px]" /><button type="submit" className="min-h-11 rounded-[11px] border border-(--color-line) px-4 text-[13px] font-medium text-(--color-brand-blue)">Search</button></form>
      {choices.slice(0, 30).map(item => <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-[12px] border p-3 ${person?.id === item.id ? "border-(--color-brand-blue) bg-(--status-blue-bg)" : "border-(--color-line)"}`}><input type="radio" name="owner" checked={person?.id === item.id} onChange={() => setPerson(item)} className="size-5 accent-(--color-brand-blue)" /><span className="grid"><span className="text-[14px] font-medium">{item.name}</span><span className="text-[13px] text-(--color-text-muted)">{item.enrolleeCount} {item.enrolleeCount === 1 ? "enrollee" : "enrollees"}{item.region ? ` · ${item.region}` : ""}</span></span></label>)}
      <ul className="grid gap-1 rounded-[12px] bg-(--status-blue-bg) p-4 text-[13px]"><li>Learning and follow-up history are kept.</li><li>Group membership and church appointments stay separate.</li></ul>
      {person ? <p className="text-center text-[14px] font-medium">{data.ownerName ?? "Unassigned"} → {person.name}</p> : null}
      <button type="button" disabled={pending || !person} onClick={() => start(async () => { const result = await changeEnrolleeOwner({ enrollmentId: data.enrollmentId, ownerUserId: person!.id, expectedOwnerId: data.ownerId }); if (!result.ok) { setError(result.error); return; } setChanging(false); setPerson(null); router.refresh(); })} className="min-h-12 rounded-[11px] bg-(--color-brand-blue) px-4 text-[14px] font-medium text-white disabled:opacity-50">{pending ? "Saving…" : "Confirm reassignment"}</button>
    </div> : null}
    {error ? <p role="alert" className="text-sm text-(--destructive)">{error}</p> : null}
    <dl className="grid gap-3 rounded-[16px] border border-(--color-line) p-4 text-[14px]"><h2 className="text-[15px] font-medium">Enrolment</h2>
      {([["Joined", stamp.format(new Date(data.joinedAt))], ["Source", data.referrerName ? `${data.referrerName}’s ${data.sourceLabel === "Referral code" ? "referral code" : "referral link"}` : data.sourceLabel ?? "Direct"], ["Location", data.place || "Not recorded"], ["Last contact", data.lastContactedAt ? stamp.format(new Date(data.lastContactedAt)) : "Not yet"]] as const).map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-(--color-text-muted)">{label}</dt><dd className="text-right">{value}</dd></div>)}</dl>
    <div className="grid gap-3"><h2 className="text-[15px] font-medium">Owner history</h2>{data.history.length ? <ol className="grid gap-3">{data.history.map((item, index) => <li key={index} className="grid gap-0.5 border-l-2 border-(--color-line) pl-3"><span className="text-[14px] font-medium">{item.title}</span><span className="text-[13px] text-(--color-text-muted)">{stamp.format(new Date(item.at))} · {item.detail}</span></li>)}</ol> : <p className="text-[13px] text-(--color-text-muted)">No recorded routing history for this older enrolment.</p>}</div>
    <Link href="/admin/follow-up" className="text-[14px] font-medium text-(--color-brand-blue)">← Back to control centre</Link>
  </section>;
}
