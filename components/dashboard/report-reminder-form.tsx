"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveReportPushPreference } from "@/app/(site)/dashboard/profile/actions";
import { PrayerReminderPrompt } from "@/components/dashboard/prayer-reminder-prompt";
import { compactButton } from "./shell/styles";

/** The 8 pm missing-report push, for people who report to the church. */
export function ReportReminderForm({ pushEnabled }: { pushEnabled: boolean }) {
  const router = useRouter();
  const [reportPush, setReportPush] = useState(pushEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          try {
            const result = await saveReportPushPreference(reportPush);
            setMessage(result.ok ? "Saved." : result.error);
            if (result.ok) router.refresh();
          } catch {
            setMessage("Could not save your reminder preference.");
          }
        });
      }}
    >
      <h2 className="m-0 text-[15px] font-medium text-(--color-text-strong)">Daily report reminder</h2>
      <label className="flex items-start gap-2 text-[13px]">
        <input type="checkbox" className="mt-0.5" checked={reportPush} onChange={(event) => setReportPush(event.target.checked)} />
        Send me a push reminder at 8 pm when my report is missing
      </label>
      <button className={`${compactButton} w-fit`} disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      {message ? <p role="status" className="text-[12.5px] text-(--color-text-muted)">{message}</p> : null}
      <PrayerReminderPrompt variant="row" />
    </form>
  );
}
