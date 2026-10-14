"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewFollowUpRequest } from "@/app/_actions/sogp-follow-up-actions";
import type { FollowUpQueueRow } from "@/lib/db/queries/sogp-follow-up-requests";

function RequestCard({ request, people }: { request: FollowUpQueueRow; people: { id: string; name: string }[] }) {
  const [person, setPerson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const router = useRouter();
  function decide(decision: "approve" | "decline") {
    if (decision === "approve" && !person) { setError("Choose the replacement follow-up person."); return; }
    startSave(async () => {
      try {
        const result = await reviewFollowUpRequest({ requestId: request.id, decision, replacementUserId: person });
        if (!result.ok) { setError(result.error); return; }
        router.refresh();
      } catch { setError("The decision could not be saved. Try again."); }
    });
  }
  return <article className="grid gap-4 rounded-[12px] border border-(--color-line) bg-white p-4">
    <div><h2 className="text-[15px] font-medium">{request.learnerName}</h2><p className="mt-1 text-[13px] text-(--color-text-muted)">Current follow-up: {request.currentOwnerName ?? "Unassigned"}</p></div>
    <p className="whitespace-pre-wrap break-words text-sm">{request.reason}</p>
    <p className="text-xs text-(--color-text-muted)">Sent {new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(new Date(request.createdAt))} (Lagos)</p>
    <label className="grid gap-2 text-[13px]">Replacement follow-up person<select aria-label={`Replacement for ${request.learnerName}`} className="min-h-11 rounded-[11px] border border-(--color-line) bg-white px-3 text-sm" value={person} disabled={saving} onChange={event => setPerson(event.target.value)}><option value="">Choose a follow-up person</option>{people.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    {error ? <p role="alert" className="text-sm text-(--destructive)">{error}</p> : null}
    <div className="flex flex-wrap gap-3"><button type="button" disabled={saving || !people.length} onClick={() => decide("approve")} className="min-h-11 rounded-[11px] bg-(--color-brand-blue) px-4 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving…" : "Approve reassignment"}</button><button type="button" disabled={saving} onClick={() => decide("decline")} className="min-h-11 rounded-[11px] border border-(--color-line) px-4 text-sm">Decline request</button></div>
  </article>;
}
export function FollowUpRequestQueue({ requests, people }: { requests: FollowUpQueueRow[]; people: { id: string; name: string }[] }) {
  return <div className="grid gap-4">{requests.length ? requests.map(request => <RequestCard key={request.id} request={request} people={people} />) : <p className="rounded-[12px] border border-(--color-line) p-6 text-sm text-(--color-text-muted)">No reassignment requests waiting.</p>}</div>;
}
