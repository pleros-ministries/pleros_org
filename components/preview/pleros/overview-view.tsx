"use client";

import Link from "next/link";
import {
  ArrowUpRightIcon,
  BellIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  NetworkIcon,
  UserRoundIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { dayReport, trackerDays } from "@/lib/preview/pleros/daily-report";
import { TIER_LABELS, coverage, directReports, openLedGroups, oversightRows, responsibilities, scopeIds } from "@/lib/preview/pleros/scope";
import { sogpProgress, sogpSchedule } from "@/lib/preview/pleros/sogp";
import { queueReminder } from "@/lib/preview/pleros/store";

import { useDemo } from "./demo-context";
import {
  PageHeader,
  ReportMark,
  SectionTitle,
  StatStrip,
  buttonSmall,
  focusRing,
  longDate,
  panel,
  weekday,
  dayNumber,
} from "./ui";

export function OverviewView() {
  const { state, viewer, today, greeting, href, run } = useDemo();
  const report = dayReport(state, viewer.id, today);
  const reports = directReports(state, viewer.id);
  const leads = reports.length > 0;
  const scope = scopeIds(state, viewer.id);
  const scopeCoverage = coverage(state, scope, today);
  const directCoverage = coverage(state, reports.map((person) => person.id), today);
  const duty = responsibilities(state, viewer.id);
  const groups = openLedGroups(state, viewer.id);
  const schedule = sogpSchedule(today);
  const todayLesson = schedule.find((day) => day.dateKey === today);
  const progress = viewer.inCohort ? sogpProgress(state, viewer.id) : null;
  const waiting = oversightRows(state, viewer.id, reports.map((person) => person.id), today).filter(
    (row) => row.overall !== "complete",
  );

  const actions: Array<{ href: string; icon: typeof ClipboardCheckIcon; title: string; done?: boolean }> = [
    report.overall === "complete"
      ? {
          href: href("reports"),
          icon: ClipboardCheckIcon,
          title: "Today's report is complete",
          done: true,
        }
      : {
          href: href("reports"),
          icon: ClipboardCheckIcon,
          title: report.reportedCount === 0 ? "Start today's report" : "Finish today's report",
        },
  ];
  if (leads) {
    actions.push({
      href: href("people"),
      icon: NetworkIcon,
      title:
        waiting.length > 0
          ? `${waiting.length} of ${reports.length} direct reports still to finish`
          : "Every direct report has finished today",
      done: waiting.length === 0,
    });
  }
  if (todayLesson?.track && viewer.inCohort) {
    actions.push({
      href: href("sogp"),
      icon: GraduationCapIcon,
      title: `Continue SOGP: ${todayLesson.track.title}`,
    });
  }
  actions.push({
    href: href("disciples"),
    icon: HeartHandshakeIcon,
    title: groups.length > 0 ? `Check in with ${groups[0]!.name}` : "Start your first discipleship group",
  });

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={longDate(today)}
        title={`${greeting}, ${viewer.firstName}`}
        titleClassName="text-[21px]"
      />

      <StatStrip
        items={[
          {
            label: "Today's report",
            href: href("reports", { day: today }),
            value: `${report.reportedCount} of 3`,
            accent: <ReportMark statuses={Object.values(report.statuses)} />,
          },
          leads
            ? {
                label: "Finished today in your scope",
                href: href("people", { day: today }),
                value: `${scopeCoverage.overall.complete} of ${scopeCoverage.expected}`,
              }
            : {
                label: "Questions",
                href: href("destinations/ask"),
                // No questions have been submitted in the synthetic demo.
                value: 0,
              },
          {
            label: "Disciples",
            href: href("disciples"),
            value: duty.disciples.length,
          },
          progress
            ? {
                label: "SOGP progress",
                href: href("sogp"),
                value: `${progress.teachings} of ${progress.teachingsTotal}`,
              }
            : { label: "SOGP", value: "—", href: href("sogp") },
        ]}
      />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section aria-labelledby="next" className="grid content-start gap-3">
          <SectionTitle id="next" title="Next steps" />
          <ul className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
            {actions.map((action) => (
              <li key={action.title}>
                <Link
                  href={action.href}
                  className={cn(
                    "group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-(--color-surface-muted)/70 sm:px-5",
                    focusRing,
                    "focus-visible:ring-inset",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      action.done
                        ? "bg-(--color-brand-lime) text-(--color-brand-blue)"
                        : "bg-(--color-brand-sky) text-(--color-brand-blue)",
                    )}
                  >
                    {action.done ? (
                      <CheckIcon className="size-[18px]" strokeWidth={2.25} aria-hidden />
                    ) : (
                      <action.icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                    )}
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="text-[14.5px] font-medium text-(--color-text-strong)">{action.title}</span>

                  </span>
                  <ChevronRightIcon
                    className="size-4 shrink-0 text-(--color-text-muted) transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <SectionTitle title="Your week of reporting" />
          </div>
          <div className={cn(panel, "grid grid-cols-7 gap-1 px-2 py-3")}>
            {trackerDays(today).map((key) => {
              const day = dayReport(state, viewer.id, key);
              return (
                <Link
                  key={key}
                  href={href("reports", { day: key })}
                  aria-label={`${longDate(key)}: ${day.reportedCount} of 3 reported`}
                  aria-current={key === today ? "date" : undefined}
                  className={cn(
                    "grid justify-items-center gap-1.5 rounded-[calc(var(--radius-sm)/2)] py-1.5 transition-colors",
                    key === today ? "bg-(--color-brand-lime) hover:bg-(--color-brand-lime)" : "hover:bg-(--color-surface-muted)",
                    focusRing,
                  )}
                >
                  <span className={cn("text-[11px] font-medium uppercase tracking-[0.06em]", key === today ? "text-(--color-brand-blue)" : "text-(--color-text-muted)")}>
                    {key === today ? "Today" : weekday(key)}
                  </span>
                  <span className={cn("text-[15px] tabular-nums", key === today ? "font-semibold text-(--color-brand-blue)" : "font-medium text-(--color-text-strong)")}>{dayNumber(key)}</span>
                  <ReportMark size="sm" statuses={Object.values(day.statuses)} />
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="workspaces" className="grid content-start gap-3">
          <SectionTitle id="workspaces" title="Quick access" />
          <ul className="grid gap-2.5">
            <Workspace
              icon={UserRoundIcon}
              title="My activity"
              href={href("reports")}
              detail={`${report.reportedCount} of 3 reported`}
            />
            <Workspace
              icon={HeartHandshakeIcon}
              title="My disciples"
              href={href("disciples")}
              detail={
                duty.disciples.length > 0
                  ? `${duty.disciples.length} in ${groups.length} named ${groups.length === 1 ? "group" : "groups"}`
                  : "No disciples yet"
              }
            />
            {leads ? (
              <Workspace
                icon={NetworkIcon}
                title="Church oversight"
                href={href("people")}
                detail={`${reports.length} direct ${reports.length === 1 ? "report" : "reports"} · ${scope.length} in your whole scope`}
              />
            ) : null}
          </ul>
          {leads ? (
            <>
              <SectionTitle
                title="Still to finish today"
                detail={`${directCoverage.overall.complete} of ${directCoverage.expected} direct reports done`}
              />
              {waiting.length > 0 ? (
                <ul className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
                  {waiting.slice(0, 4).map((row) => (
                    <li key={row.person.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="grid min-w-0 flex-1 gap-0.5">
                        <p className="truncate text-[13.5px] font-medium text-(--color-text-strong)">{row.person.name}</p>
                        <p className="flex items-center gap-2 text-[12px] text-(--color-text-muted)">
                          <ReportMark size="sm" statuses={Object.values(row.statuses)} />
                          {TIER_LABELS[row.person.tier]}
                        </p>
                      </div>
                      {row.reminder ? (
                        <span className="text-[12px] text-(--color-text-muted)">Reminder queued</span>
                      ) : (
                        <button
                          type="button"
                          className={buttonSmall}
                          onClick={() => run((current) => queueReminder(current, viewer.id, row.person.id, today))}
                        >
                          <BellIcon className="size-3.5" aria-hidden />
                          Remind
                        </button>
                      )}
                    </li>
                  ))}
                  {waiting.length > 4 ? (
                    <li>
                      <Link
                        href={href("people")}
                        className={cn("flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-(--color-brand-blue)", focusRing)}
                      >
                        See all {waiting.length}
                        <ArrowUpRightIcon className="size-4" aria-hidden />
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className={cn(panel, "px-4 py-3 text-[13.5px] text-(--color-text)")}>
                  Everyone who reports to you has finished today.
                </p>
              )}
              
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Workspace({
  icon: Icon,
  title,
  detail,
  href,
}: {
  icon: typeof UserRoundIcon;
  title: string;
  detail: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--color-brand-sky) text-(--color-brand-blue)">
        <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="grid gap-0.5">
        <span className="text-[14px] font-medium text-(--color-text-strong)">{title}</span>
        <span className="text-[12.5px] leading-snug text-(--color-text-muted)">{detail}</span>
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <Link
          href={href}
          className={cn(panel, "flex items-center gap-3 px-4 py-3 transition-colors hover:border-(--color-brand-blue)", focusRing)}
        >
          {body}
        </Link>
      ) : (
        <div className={cn(panel, "flex items-center gap-3 border-dashed bg-transparent px-4 py-3")}>{body}</div>
      )}
    </li>
  );
}
