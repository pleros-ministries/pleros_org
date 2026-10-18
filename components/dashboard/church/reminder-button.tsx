"use client";
import { useState, useTransition } from "react";
import { BellIcon } from "lucide-react";
import { remindChurchMember } from "@/app/(site)/dashboard/church/actions";
import styles from "@/components/community/discipleship/discipleship-group.module.css";
export function ChurchReminderButton({ subjectId, day, enabled = false }: { subjectId: string; day: string; enabled?: boolean }) {
  const [pending, start] = useTransition(); const [message, setMessage] = useState<string | null>(null);
  if (!enabled) return null;
  return <div className="grid justify-items-start gap-2"><button type="button" className={styles.btn} disabled={pending} onClick={() => start(async () => { try { const result = await remindChurchMember(subjectId, day); setMessage(result.ok ? result.sent ? "Reminder sent." : "No reminder needed, or already sent today." : result.error); } catch { setMessage("Could not send the reminder."); } })}><BellIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />{pending ? "Sending…" : "Send reminder"}</button>{message ? <p role="status" className={styles.note}>{message}</p> : null}</div>;
}
