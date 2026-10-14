"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import dashboardStyles from "@/components/dashboard/v3/dashboard.module.css";
import { MinistryFormV3 } from "./ministry-form";

/** Synthetic adapter only. No DB, auth, session, messaging or account lookup imports. */
export function MinistryReportPreview({ kind }: { kind: "outreach" | "follow_up" }) {
  const [fail, setFail] = useState(false);
  const [message, setMessage] = useState("");
  return <div className={dashboardStyles.root} data-dashboard-v3>
    <header className="mx-auto flex h-12 max-w-160 items-center justify-between border-b border-(--color-line) px-1">
      <Link className="grid size-11 place-items-center" aria-label="Back to dashboard preview" href="/preview/dashboard-v3"><DashboardIcon name="left" /></Link>
      <span className="text-[14px] font-medium">Record ministry</span><span className="size-11" aria-hidden />
    </header>
    <MinistryFormV3 dateKey="2026-10-13" today="2026-10-13" initialKind={kind} initialCount={kind === "outreach" ? "12" : "3"} initialContacts={[
      { key: "sample-amara", name: "Amara Okafor", phone: "+234 800 000 0101", email: null, note: null },
      { key: "sample-dayo", name: "Dayo Eze", phone: "+234 800 000 0102", email: null, note: null },
    ]} onSave={async () => {
      if (fail) return { ok: false, error: "Sample save failed. Your entries are preserved. Switch off the failure and retry." };
      setMessage("Saved in this preview only. No live report, contact, account or invitation was created.");
      return { ok: true };
    }} />
    <aside className="mx-auto grid max-w-160 gap-3 border-t border-(--color-line) p-4 text-[13px] text-(--color-text-muted)">
      <p>This is an isolated interaction preview. Live persistence awaits the migration and permission integration.</p>
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={fail} onChange={event => setFail(event.target.checked)} />Simulate a save failure</label>
      {message ? <p role="status">{message}</p> : null}
    </aside>
  </div>;
}
