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
    <MinistryFormV3 dateKey={day} today={today} days={activityId ? undefined : reportableDateKeys(today)} onDayChange={setDay} initialKind={initial?.kind} initialCount={initial ? String(initial.peopleCount) : ""} initialContacts={initial?.contacts} initialDetails={initial} savedContacts={contacts} onCreateContact={createPrivateContactAction} readOnly={readOnly} lockKind={Boolean(activityId)} onSave={async payload => {
      requestKey.current ??= crypto.randomUUID();
      const result = await saveUnifiedMinistryAction({ ...payload, contacts: payload.contacts.map(row => row.key), activityId, requestKey: requestKey.current });
      if (!result.ok) return result;
      router.push(`/dashboard/community/report?day=${encodeURIComponent(day)}`); router.refresh();
      return { ok: true };
    }} />
  </div>;
}
