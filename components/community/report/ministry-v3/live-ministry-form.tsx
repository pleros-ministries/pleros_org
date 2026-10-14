"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MinistryFormV3, type MinistryFormPayload } from "./ministry-form";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import { createPrivateContactAction, saveUnifiedMinistryAction } from "@/app/(site)/dashboard/community/_actions/reporting-v3-actions";
import { reportableDateKeys } from "@/lib/community/ministry-report";

export function LiveMinistryForm({ dateKey, today, contacts, initial, activityId, readOnly = false }: {
  dateKey: string; today: string; contacts: MinistryContact[]; activityId?: number; readOnly?: boolean;
  initial?: MinistryFormPayload;
}) {
  const router = useRouter();
  const [day, setDay] = useState(dateKey);
  const requestKey = useRef<string | null>(null);
  return <div>
    {!activityId ? <label className="mx-auto flex max-w-160 items-center justify-between gap-3 px-4 pt-4 text-[13px]">Report day
      <select className="h-11 rounded-[11px] border border-(--color-line) bg-white px-3 text-[16px]" value={day} onChange={event => setDay(event.target.value)}>{reportableDateKeys(today).map(date => <option key={date}>{date}</option>)}</select>
    </label> : null}
    <MinistryFormV3 dateKey={day} initialKind={initial?.kind} initialCount={initial ? String(initial.peopleCount) : ""} initialContacts={initial?.contacts} initialDetails={initial} savedContacts={contacts} onCreateContact={createPrivateContactAction} readOnly={readOnly} lockKind={Boolean(activityId)} onSave={async payload => {
      requestKey.current ??= crypto.randomUUID();
      const result = await saveUnifiedMinistryAction({ ...payload, contacts: payload.contacts.map(row => row.key), activityId, requestKey: requestKey.current });
      if (!result.ok) return result;
      router.push(`/dashboard/community/report?day=${encodeURIComponent(day)}`); router.refresh();
      return { ok: true };
    }} />
  </div>;
}
