"use client";

import { LockIcon } from "lucide-react";

import { activityKeyNumbers, activityTitle } from "@/lib/community/activity-form";
import { cn } from "@/lib/utils";
import {
  categoryStatus,
  dayReport,
  isWritableDay,
  recordedLines,
} from "@/lib/preview/pleros/daily-report";
import type { DemoActivity } from "@/lib/preview/pleros/types";

import { useDemo } from "./demo-context";
import { CategoryChoice, FullDayReport } from "./report-parts";
import { DayTracker, OverallPill, PageHeader, ReportMark, longDate, panel } from "./ui";
import { useTrackerWindow } from "./use-tracker";

function activitySummary(rows: DemoActivity[]): string {
  if (rows.length === 0) return "";
  if (rows.length === 1) return `${activityTitle(rows[0]!)} · ${activityKeyNumbers(rows[0]!)}`;
  return `${rows.length} activities · ${rows.map((row) => activityTitle(row)).join(", ")}`;
}

/** Daily reports: a day tracker, exactly three report choices and the full day underneath. */
export function ReportsView() {
  const { state, viewer, day, today, setDay } = useDemo();
  const tracker = useTrackerWindow(day, today);
  const report = dayReport(state, viewer.id, day);
  const writable = isWritableDay(day, today);
  const recorded = recordedLines(report.devotion).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={longDate(day)}
        title="Daily reports"
        actions={<OverallPill status={report.overall} />}
      />

      <div className={cn(panel, "px-1 py-2 sm:px-3 sm:py-2.5")}>
        <DayTracker
          days={tracker.days}
          selected={day}
          today={today}
          onSelect={setDay}
          onShift={tracker.shift}
          canShiftBack={tracker.canShiftBack}
          writable={(key) => isWritableDay(key, today)}
          renderMark={(key) => (
            <ReportMark
              size="sm"
              statuses={(["devotional", "ministry", "meetings"] as const).map((category) =>
                categoryStatus(state, viewer.id, key, category),
              )}
            />
          )}
          label="Report days"
          describe={(key) => `${dayReport(state, viewer.id, key).reportedCount} of 3 reported`}
        />
      </div>

      {!writable ? (
        <p className="flex items-start gap-2 text-[13px] text-(--color-text-muted)">
          <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          View only.
        </p>
      ) : null}

      <section aria-label="Report choices">
        <ul className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
          <CategoryChoice
            category="devotional"
            report={report}
            summary={`${recorded} of ${report.devotionLines.length} recorded`}
          />
          <CategoryChoice
            category="ministry"
            report={report}
            summary={activitySummary(report.ministry)}
          />
          <CategoryChoice
            category="meetings"
            report={report}
            summary={activitySummary(report.meetings)}
          />
        </ul>
      </section>

      <FullDayReport report={report} />
    </div>
  );
}
