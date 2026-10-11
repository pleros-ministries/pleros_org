"use client";
import { useState, useTransition } from "react";
import { remindChurchMember } from "@/app/(site)/dashboard/church/actions";
import { compactButton } from "../shell/styles";
export function ChurchReminderButton({ subjectId, day, enabled = false }: { subjectId: string; day: string; enabled?: boolean }) {
  const [pending, start] = useTransition(); const [message, setMessage] = useState<string | null>(null);
  if (!enabled) return null;
  return <div className="grid justify-items-start gap-2"><button className={compactButton} disabled={pending} onClick={() => start(async () => { try { const result = await remindChurchMember(subjectId, day); setMessage(result.ok ? result.sent ? "Reminder sent." : "No reminder needed, or already sent today." : result.error); } catch { setMessage("Could not send the reminder."); } })}>Send reminder</button>{message ? <p role="status" className="text-[13px]">{message}</p> : null}</div>;
}
