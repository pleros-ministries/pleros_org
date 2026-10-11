"use client";

import type { MeetingReportingRole } from "@/lib/community/daily-report";
import { ChoiceGroup } from "../choice-chips";
import { textareaClass } from "../styles";

export function MeetingFields({ role, taught, onRole, onTaught }: {
  role: MeetingReportingRole | null; taught: string;
  onRole: (role: MeetingReportingRole) => void; onTaught: (value: string) => void;
}) {
  return <div className="grid gap-4">
    <div className="grid gap-2"><p className="text-[13px] font-medium">Your role *</p><ChoiceGroup name="meeting-role" label="Your role in this meeting" value={role} onChange={onRole} options={[{ key: "leader", label: "Leader" }, { key: "worker", label: "Worker" }, { key: "member", label: "Member" }]} /></div>
    {role === "member" ? <p className="text-[13px] text-(--color-text-muted)">Recording your own attendance.</p> : null}
    {role === "leader" ? <label className="grid gap-1 text-[13px] font-medium" htmlFor="meeting-taught">What was taught *<textarea id="meeting-taught" value={taught} maxLength={500} rows={3} onChange={(event) => onTaught(event.target.value)} className={textareaClass} /></label> : null}
  </div>;
}
