"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewFollowUpRequest, searchFollowUpOwners } from "@/app/_actions/sogp-follow-up-actions";
import type { FollowUpOwnerCandidate, FollowUpQueueRow } from "@/lib/db/queries/sogp-follow-up-requests";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");
const lagos = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" });

/** Paper: Pleros-change-owner. Admin-only; membership and church appointments are untouched. */
function RequestCard({ request, people }: { request: FollowUpQueueRow; people: FollowUpOwnerCandidate[] }) {
  const [person, setPerson] = useState<FollowUpOwnerCandidate | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FollowUpOwnerCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [searching, startSearch] = useTransition();
  const router = useRouter();
  const choices = (results ?? people).filter(item => item.name !== request.currentOwnerName);
  function search(event: React.FormEvent) {
    event.preventDefault();
    startSearch(async () => { const result = await searchFollowUpOwners(query); if (result.ok) { setResults(result.value); setError(null); } else setError(result.error); });
  }
  function decide(decision: "approve" | "decline") {
    if (decision === "approve" && !person) { setError("Choose the new follow-up owner."); return; }
    startSave(async () => {
      try {
        const result = await reviewFollowUpRequest({ requestId: request.id, decision, replacementUserId: person?.id });
        if (!result.ok) { setError(result.error); return; }
        router.refresh();
      } catch { setError("The decision could not be saved. Try again."); }
    });
  }
  return <article className="grid gap-5 rounded-[16px] border border-(--color-line) bg-white p-4">
    <header className="grid gap-1"><p className="text-[12px] font-medium tracking-[.04em] text-(--color-text-muted) uppercase">Reassignment request</p><h2 className="text-[20px] leading-7 font-medium">Choose someone to help</h2><p className="text-[13px] text-(--color-text-muted)">{request.learnerName} · Currently {request.currentOwnerName ?? "unassigned"}{request.ownerWithdrawn ? " · Owner withdrawn" : null}</p></header>
    <blockquote className="rounded-[12px] bg-(--color-surface-muted) p-4 text-[14px] whitespace-pre-wrap break-words">“{request.reason}”<span className="mt-2 block text-[12px] text-(--color-text-muted)">Sent {lagos.format(new Date(request.createdAt))} (Lagos)</span></blockquote>
    <form onSubmit={search} className="flex gap-2"><label className="sr-only" htmlFor={`owner-search-${request.id}`}>Search follow-up owners</label><input id={`owner-search-${request.id}`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search follow-up owners or enrollees" className="min-h-11 flex-1 rounded-[11px] bg-(--color-surface-muted) px-4 text-[16px]" /><button type="submit" disabled={searching} className="min-h-11 rounded-[11px] border border-(--color-line) px-4 text-[13px] font-medium text-(--color-brand-blue)">{searching ? "Searching…" : "Search"}</button></form>
    <fieldset className="grid gap-2"><legend className="mb-2 text-[15px] font-medium">{results ? "Search results" : "People in your assignment scope"}</legend>
      {choices.length ? choices.map(item => <label key={item.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[12px] border p-3 ${person?.id === item.id ? "border-(--color-brand-blue) bg-(--status-blue-bg)" : "border-(--color-line)"}`}>
        <input type="radio" name={`owner-${request.id}`} checked={person?.id === item.id} onChange={() => setPerson(item)} className="size-5 accent-(--color-brand-blue)" />
        <span className="grid size-9 place-items-center rounded-full bg-(--status-green-bg) text-[12px] text-(--status-green-text)">{initials(item.name)}</span>
        <span className="grid"><span className="text-[14px] font-medium">{item.name}</span><span className="text-[13px] text-(--color-text-muted)">{item.enrolleeCount} {item.enrolleeCount === 1 ? "enrollee" : "enrollees"}{item.region ? ` · ${item.region}` : ""}{item.kind === "enrollee" ? " · Enrollee" : " · Pastor"}</span></span>
      </label>) : <p className="text-[13px] text-(--color-text-muted)">{results ? "No eligible people match. Owners must be a pastor or hold an active enrolment." : "No follow-up owners yet. Search to find an enrollee."}</p>}
    </fieldset>
    <ul className="grid gap-2 rounded-[12px] bg-(--status-blue-bg) p-4 text-[13px]">
      <li>{request.learnerName.split(" ")[0]} moves to {person ? `${person.name.split(" ")[0]}’s` : "the new owner’s"} enrollee list.</li>
      <li>Learning and follow-up history are kept.</li>
      <li>Group membership and church appointments stay separate.</li>
    </ul>
    {person ? <p className="text-center text-[14px] font-medium">{request.currentOwnerName ?? "Unassigned"} → {person.name}</p> : null}
    {error ? <p role="alert" className="text-sm text-(--destructive)">{error}</p> : null}
    <div className="grid gap-2"><button type="button" disabled={saving || !person} onClick={() => decide("approve")} className="min-h-12 rounded-[11px] bg-(--color-brand-blue) px-4 text-[14px] font-medium text-white disabled:opacity-50">{saving ? "Saving…" : "Confirm reassignment"}</button><button type="button" disabled={saving} onClick={() => decide("decline")} className="min-h-11 rounded-[11px] border border-(--color-line) px-4 text-[14px]">Decline request</button></div>
  </article>;
}

export function FollowUpRequestQueue({ requests, people }: { requests: FollowUpQueueRow[]; people: FollowUpOwnerCandidate[] }) {
  return <div className="grid gap-4">{requests.length ? requests.map(request => <RequestCard key={request.id} request={request} people={people} />) : <p className="rounded-[12px] border border-(--color-line) p-6 text-sm text-(--color-text-muted)">No reassignment requests waiting.</p>}</div>;
}
