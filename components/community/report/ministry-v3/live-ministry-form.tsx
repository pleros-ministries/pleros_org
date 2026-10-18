"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MinistryFormV3, type MinistryFormPayload } from "./ministry-form";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import { createPrivateContactAction, saveUnifiedMinistryAction } from "@/app/(site)/dashboard/community/_actions/reporting-v3-actions";
import { reportableDateKeys } from "@/lib/community/ministry-report";

export function LiveMinistryForm({ dateKey, today, contacts, initial, activityId, readOnly = false, embedded = false, onSaved }: {
  dateKey: string; today: string; contacts: MinistryContact[]; activityId?: number; readOnly?: boolean;
  initial?: Partial<MinistryFormPayload>;
  /** Inside the one-page report: saving refreshes the page in place instead of navigating. */
  embedded?: boolean; onSaved?: () => void;
}) {
  const router = useRouter();
  const [day, setDay] = useState(dateKey);
  const requestKey = useRef<string | null>(null);
  return <div>
    <MinistryFormV3 dateKey={day} today={today} days={activityId ? undefined : reportableDateKeys(today)} onDayChange={setDay} initialKind={initial?.kind} initialCount={initial?.peopleCount != null ? String(initial.peopleCount) : ""} initialContacts={initial?.contacts} initialDetails={initial} savedContacts={contacts} onCreateContact={createPrivateContactAction} readOnly={readOnly} lockKind={Boolean(activityId) || embedded} embedded={embedded} onSave={async payload => {
      requestKey.current ??= crypto.randomUUID();
      const result = await saveUnifiedMinistryAction({ ...payload, contacts: payload.contacts.map(row => row.key), activityId, requestKey: requestKey.current });
      if (!result.ok) return result;
      if (embedded) { router.refresh(); onSaved?.(); return { ok: true }; }
      router.push(`/dashboard/community/report?day=${encodeURIComponent(day)}`); router.refresh();
      return { ok: true };
    }} />
  </div>;
}
