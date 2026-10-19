"use client";
import { useRef, useState, useTransition } from "react";

import { handOverEnrolleesAction, searchHandoverCandidatesAction } from "@/app/(site)/dashboard/community/_actions/people-actions";
import type { HandoverCandidate } from "@/lib/db/queries/enrollee-handover";
import styles from "../discipleship/discipleship-group.module.css";
import { Initials } from "../discipleship/shared";

/**
 * Search for a member, confirm, and hand one or more enrollees over to them
 * (user decision, 18 October). `who` is "Roni" or "3 people".
 */
export function HandoverPicker({ enrollmentIds, who, onDone, bare = false }: {
  enrollmentIds: number[];
  who: string;
  /** Inside another surface (the selection bar): no border of its own, results scroll. */
  bare?: boolean;
  onDone: (result: { moved: number; skipped: number }) => void;
}) {
  const [term, setTerm] = useState("");
  const [people, setPeople] = useState<HandoverCandidate[]>([]);
  const [chosen, setChosen] = useState<HandoverCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [saving, startSave] = useTransition();
  const latest = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function search(value: string) {
    setTerm(value); setChosen(null); setError(null);
    latest.current = value;
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) { setPeople([]); return; }
    // Wait for a pause in typing, and keep only the answer for the latest term.
    timer.current = setTimeout(() => startSearch(async () => {
      const result = await searchHandoverCandidatesAction({ enrollmentId: enrollmentIds[0]!, term: value });
      if (latest.current !== value) return;
      if (result.ok) setPeople(result.people); else setError(result.error);
    }), 250);
  }
  function confirm() {
    if (!chosen) return;
    startSave(async () => {
      const result = await handOverEnrolleesAction({ enrollmentIds, newOwnerUserId: chosen.userId });
      if (!result.ok) { setError(result.error); return; }
      onDone({ moved: result.moved, skipped: result.skipped });
    });
  }
  const chosenFirst = chosen?.name.split(" ")[0] ?? "";
  const plural = enrollmentIds.length > 1;
  return <div className={bare ? "grid gap-3" : `${styles.panel} grid gap-3 p-3.5`}>
    {chosen ? <>
      <p className="m-0 text-[13.5px]">Hand {who} over to <b className="font-medium">{chosen.name}</b>?</p>
      <p className="m-0 text-[12px] text-(--color-community-muted)">{chosenFirst} will look after {who} from now on and gets a notification. {plural ? "They leave" : `${who} leaves`} your enrollees and you stop seeing {plural ? "their phone numbers" : "their phone number"}. Your notes stay private to you.</p>
      <div className="flex gap-2"><button type="button" className={styles.btn} data-primary disabled={saving} onClick={confirm}>{saving ? "Handing over…" : `Hand ${who} over`}</button><button type="button" className={styles.btn} disabled={saving} onClick={() => setChosen(null)}>Back</button></div>
    </> : <>
      <label className="grid gap-1.5 text-[13px] font-medium">Who should look after {who} now?<input type="search" value={term} onChange={event => search(event.target.value)} placeholder="Search by name" autoComplete="off" className="h-10 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3 text-[14px] font-normal outline-none focus:border-(--color-community-blue)" /></label>
      {term.trim().length >= 2 ? (people.length ? <ul className={`${styles.list} ${bare ? "-mx-3 max-h-[40dvh] overflow-y-auto" : "-mx-3.5"}`}>
        {people.map(person => <li key={person.userId}><button type="button" className={`${styles.row} w-full text-left`} onClick={() => setChosen(person)}>
          <Initials name={person.name} />
          <span className="grid min-w-0 flex-1"><span className="truncate text-[13.5px] font-medium">{person.name}</span>{person.region ? <span className="text-[12px] text-(--color-community-muted)">{person.region}</span> : null}</span>
          <span className="text-[12.5px] font-medium text-(--color-community-blue)">Choose</span>
        </button></li>)}
      </ul> : <p className="m-0 text-[12.5px] text-(--color-community-muted)">{searching ? "Searching…" : "No one found with that name."}</p>) : null}
    </>}
    {error ? <p role="alert" className="m-0 text-[12.5px] text-(--destructive)">{error}</p> : null}
  </div>;
}
