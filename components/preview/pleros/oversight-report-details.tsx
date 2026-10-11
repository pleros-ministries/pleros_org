import { activityFields, activityKindLabel } from "@/lib/community/ministry-activities";
import { MINISTRY_FIELDS } from "@/lib/community/ministry-report";
import { meetingRoleLabel } from "@/lib/preview/pleros/daily-report";
import type { OversightReport } from "@/lib/preview/pleros/oversight-report";
import { StatusPill } from "./ui";

export function OversightReportDetails({ report }: { report: OversightReport }) {
  return <div className="grid gap-5">
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-3"><h3 className="text-[15px] font-medium text-(--color-text-strong)">Devotional reports</h3><StatusPill status={report.statuses.devotional} /></div>
      <ul className="grid gap-1.5 text-[13px] text-(--color-text)">
        {report.devotionLines.map((line) => <li key={line.key}>{line.label} · {line.detail ?? "not recorded"}</li>)}
      </ul>
    </section>
    {(["ministry", "meetings"] as const).map((category) => <section key={category} className="grid gap-2">
      <div className="flex items-center justify-between gap-3"><h3 className="text-[15px] font-medium text-(--color-text-strong)">{category === "ministry" ? "Ministry reports" : "Meetings reports"}</h3><StatusPill status={report.statuses[category]} /></div>
      {report[category].length ? <ul className="grid gap-2">
        {report[category].map((activity) => <li key={activity.id} className="grid gap-2 rounded-[var(--radius-sm)] border border-(--color-line) p-3 text-[13px]">
          <p className="font-medium text-(--color-text-strong)">{activityKindLabel(activity.kind)}{activity.title ? ` · ${activity.title}` : ""}</p>
          <p className="text-[12px] text-(--color-text-muted)">{[activity.mode, activity.platform, activity.location, activity.meetingRole && meetingRoleLabel(activity.meetingRole)].filter(Boolean).join(" · ")}</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
            {MINISTRY_FIELDS.filter(({ key }) => activityFields(activity.kind, activity.mode).shown.includes(key) || activity.numbers[key] > 0).map(({ key, short }) => <div key={key} className="flex items-center justify-between gap-2"><dt className="text-(--color-text-muted)">{short}</dt><dd className="font-medium tabular-nums text-(--color-text-strong)">{activity.numbers[key]}</dd></div>)}
          </dl>
          {activity.taught ? <p className="text-(--color-text)"><span className="font-medium">What was taught</span> · {activity.taught}</p> : null}
        </li>)}
      </ul> : <p className="text-[13px] text-(--color-text-muted)">{report.statuses[category] === "nil" ? category === "meetings" ? "No meeting" : "Nil" : "Not reported"}</p>}
    </section>)}
  </div>;
}
