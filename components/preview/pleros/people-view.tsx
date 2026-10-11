"use client";

import { useState } from "react";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { BellIcon, BellOffIcon, ChevronRightIcon, FileTextIcon, UsersIcon } from "lucide-react";


import { cn } from "@/lib/utils";
import {
  REPORT_CATEGORIES,
  dayReport,
  isWritableDay,
  trackerDays,
} from "@/lib/preview/pleros/daily-report";
import { TIER_LABELS, coverage, groupOversightRows, resolveOversightScope, oversees, directReports, findPerson, oversightRow, oversightRows, scopeBranches, scopeIds, supervisorChain, type Coverage, type OversightRow } from "@/lib/preview/pleros/scope";
import { canSeeReportDetails, oversightReport } from "@/lib/preview/pleros/oversight-report";
import { OversightReportDetails } from "./oversight-report-details";
import { cancelReminder, queueReminder } from "@/lib/preview/pleros/store";
import type { OverallStatus } from "@/lib/preview/pleros/types";

import { useDemo } from "./demo-context";
import {
  CountBadge,
  DayTracker,
  EmptyState,
  Initials,
  OverallPill,
  PageHeader,
  ReportMark,
  SectionTitle,
  Segmented,
  Sheet,
  StatStrip,
  StatusPill,
  buttonSmall,
  focusRing,
  longDate,
  panel,
  relativeDay,
  shortDate,
} from "./ui";
import { useTrackerWindow } from "./use-tracker";

type Filter = "all" | OverallStatus;

export function PeopleView() {
  const { state, viewer, href } = useDemo();
  const params = useSearchParams();
  const root = resolveOversightScope(state, viewer.id, params.get("scope"));
  if (!root) return <EmptyState title="Scope unavailable" action={<Link className={buttonSmall} href={href("people")}>Back to your scope</Link>} />;
  return <div className="grid gap-5"><PageHeader eyebrow={<Breadcrumb rootId={root.id} />} title="Church oversight" /><Organisation key={`${viewer.id}:${root.id}`} rootId={root.id} /></div>;
}

function Breadcrumb({ rootId }: { rootId: string }) {
  const { state, viewer, href } = useDemo();
  const root = findPerson(state, rootId)!;
  const chain = [...supervisorChain(state, root.id).reverse(), root];
  return <nav aria-label="Church scope"><ol className="flex flex-wrap items-center gap-1.5">{chain.map((person, index) => {
    const label = person.tier === "worker" ? person.name : person.orgUnit ?? person.name;
    const allowed = person.id === viewer.id || oversees(state, viewer.id, person.id);
    return <li key={person.id} className="flex items-center gap-1.5">{index > 0 ? <ChevronRightIcon className="size-3" aria-hidden /> : null}{allowed && person.id !== root.id ? <Link className={cn("rounded hover:underline", focusRing)} href={href("people", { scope: person.id === viewer.id ? null : person.id })}>{label}</Link> : <span aria-current={person.id === root.id ? "location" : undefined}>{label}</span>}</li>;
  })}</ol></nav>;
}

// ─── Organisation ─────────────────────────────────────────────────────────

function Organisation({ rootId }: { rootId: string }) {
  const { state, viewer, day, today, setDay, href, run } = useDemo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tracker = useTrackerWindow(day, today);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const lens = searchParams.get("lens") === "scope" ? "scope" : "direct";
  const direct = directReports(state, rootId).map((person) => person.id);
  const scope = scopeIds(state, rootId);
  const ids = lens === "scope" ? scope : direct;
  const rows = oversightRows(state, viewer.id, ids, day);
  const totals = coverage(state, ids, day);
  const branches = scopeBranches(state, rootId, day).filter((branch) => branch.ids.length > 1);
  const visible = filter === "all" ? rows : rows.filter((row) => row.overall === filter);
  const reminders = state.reminders.filter((reminder) => reminder.byId === viewer.id && (reminder.subjectId === rootId || scope.includes(reminder.subjectId)));

  const setLens = (next: "direct" | "scope") =>
    router.replace(href("people", { scope: rootId === viewer.id ? null : rootId, lens: next === "scope" ? "scope" : null }), { scroll: false });

  const enterScope = (id: string) => router.push(href("people", { scope: id === viewer.id ? null : id }));
  const grouped = lens === "scope" ? groupOversightRows(state, visible) : [{ id: "direct", label: "Direct reports", leader: null, rows: visible }];

  return (
    <>
      

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Lens"
          value={lens}
          onChange={setLens}
          options={[
            { key: "direct", label: "Direct reports", count: direct.length },
            { key: "scope", label: "Entire scope", count: scope.length },
          ]}
        />
        {rootId !== viewer.id ? <button type="button" onClick={() => setOpenId(rootId)} className={buttonSmall}><FileTextIcon className="size-3.5" aria-hidden />View {findPerson(state, rootId)?.firstName}&apos;s report</button> : null}

      </div>

      <div className={cn(panel, "px-1 py-2 sm:px-3 sm:py-2.5")}>
        <DayTracker
          days={tracker.days}
          selected={day}
          today={today}
          onSelect={setDay}
          onShift={tracker.shift}
          canShiftBack={tracker.canShiftBack}
          writable={(key) => isWritableDay(key, today)}
          label="Reporting days"
          describe={(key) => {
            const value = coverage(state, ids, key);
            return `${value.overall.complete} of ${value.expected} finished`;
          }}
          renderMark={(key) => {
            const value = coverage(state, ids, key);
            return <CoverageBar coverage={value} compact />;
          }}
        />
      </div>

      <StatStrip
        items={[
          {
            label: `Finished ${relativeDay(day, today).toLowerCase() === "today" ? "today" : shortDate(day)}`,
            value: `${totals.overall.complete} of ${totals.expected}`,
            detail: <CoverageBar coverage={totals} />,
          },
          { label: "In progress", value: totals.overall.in_progress, detail: "" },
          { label: "Not started", value: totals.overall.not_started, detail: "" },
          canSeeReportDetails(state, viewer.id) ? {
            label: "Recorded reach",
            value: totals.recordedReach,
            detail: `${totals.numbers.attendance} at meetings · ${totals.numbers.followUps} follow-ups`,
          } : { label: "Reminders queued", value: reminders.length },
        ]}
      />

      {lens === "scope" && branches.length > 0 ? (
        <section aria-labelledby="branches" className="grid gap-3">
          <SectionTitle id="branches" title="By branch" />
          <div className={cn(panel, "overflow-x-auto")}>
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-(--color-line) text-[12px] text-(--color-text-muted)">
                  <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Lead</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Reporting</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Finished</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">Recorded reach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-line)">
                {branches.map((branch) => (
                  <tr key={branch.lead.id}>
                    <td className="px-4 py-3 sm:px-5">
                      <button type="button" onClick={() => enterScope(branch.lead.id)} className={cn("inline-flex items-center gap-1 rounded text-left font-medium text-(--color-brand-blue) hover:underline", focusRing)}>{branch.lead.orgUnit}<ChevronRightIcon className="size-3" aria-hidden /></button>
                      <p className="text-[12px] text-(--color-text-muted)">
                        {branch.lead.name} · {TIER_LABELS[branch.lead.tier]}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <CoverageBar coverage={branch.coverage} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {branch.coverage.overall.complete} of {branch.coverage.expected}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums sm:px-5">{branch.coverage.recordedReach}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="roster" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle id="roster" title={lens === "scope" ? "Everyone in your scope" : "Your direct reports"} />
          <div role="group" aria-label="Filter by reporting status" className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", `All ${rows.length}`],
                ["complete", `Finished ${totals.overall.complete}`],
                ["in_progress", `In progress ${totals.overall.in_progress}`],
                ["not_started", `Not started ${totals.overall.not_started}`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  "min-h-8 rounded-full border px-3 text-[12.5px] font-medium tabular-nums transition-colors",
                  focusRing,
                  filter === key
                    ? "border-(--color-brand-blue) bg-(--color-brand-blue) text-white"
                    : "border-(--color-line-strong) bg-white text-(--color-text) hover:border-(--color-brand-blue)",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon={<UsersIcon className="size-5" aria-hidden />} title={rows.length === 0 ? "No direct reports" : "No one matches this filter"}></EmptyState>
        ) : (
          <div className={cn(panel, "overflow-hidden")}>
            <table className="w-full text-left text-[13.5px]">
              <thead className="max-md:sr-only">
                <tr className="border-b border-(--color-line) text-[12px] text-(--color-text-muted)">
                  <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Person</th>
                  {REPORT_CATEGORIES.map((category) => (
                    <th key={category.key} scope="col" className="px-2 py-2.5 font-medium">
                      {category.short}
                    </th>
                  ))}
                  <th scope="col" className="px-2 py-2.5 font-medium">Day</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              {grouped.map((group) => <tbody key={group.id} className="divide-y divide-(--color-line)">
                {lens === "scope" ? <tr className="bg-(--color-brand-sky-soft)/60 max-md:block"><th scope="rowgroup" colSpan={6} className="px-4 py-2.5 text-left sm:px-5"><div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-(--color-brand-blue)">{group.leader ? <button type="button" className={cn("rounded hover:underline", focusRing)} onClick={() => enterScope(group.leader!.id)}>{group.label} · {group.leader.name}</button> : group.label}<CountBadge count={group.rows.length} /></div></th></tr> : null}
                {group.rows.map((row) => <RosterRow key={row.person.id} row={row} onOpen={() => enterScope(row.person.id)} onReport={() => setOpenId(row.person.id)} onRemind={() => run((current) => queueReminder(current, viewer.id, row.person.id, day))} />)}
              </tbody>)}
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="queue" className="grid gap-3">
        <SectionTitle id="queue" title="Reminder queue" />
        <div className={cn(panel, "overflow-hidden")}>
          {reminders.length === 0 ? (
            <p className="px-4 py-4 text-[13.5px] text-(--color-text-muted) sm:px-5">
No reminders queued.
            </p>
          ) : (
            <ul className="divide-y divide-(--color-line)">
              {reminders.map((reminder) => {
                const subject = findPerson(state, reminder.subjectId);
                return (
                  <li key={reminder.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                    <BellIcon className="size-4 text-(--color-brand-blue)" aria-hidden />
                    <p className="min-w-0 flex-1 text-[13.5px]">
                      <span className="font-medium text-(--color-text-strong)">{subject?.name}</span>
                      <span className="text-(--color-text-muted)"> · for {shortDate(reminder.dateKey)} · queued</span>
                    </p>
                    <button
                      type="button"
                      className={buttonSmall}
                      onClick={() => run((current) => cancelReminder(current, viewer.id, reminder.id))}
                    >
                      <BellOffIcon className="size-3.5" aria-hidden />
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          
        </div>
      </section>

      <PersonSheet personId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

function CoverageBar({ coverage: value, compact = false }: { coverage: Coverage; compact?: boolean }) {
  const total = Math.max(1, value.expected);
  const parts: Array<[number, string]> = [
    [value.overall.complete, "bg-(--color-brand-blue)"],
    [value.overall.in_progress, "bg-(--color-brand-sky)"],
  ];
  if (compact) {
    return (
      <span className="text-[10.5px] font-medium tabular-nums text-(--color-text-muted)">
        {value.overall.complete}/{value.expected}
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={`${value.overall.complete} finished, ${value.overall.in_progress} in progress, ${value.overall.not_started} not started`}
      className="flex h-1.5 w-full min-w-24 overflow-hidden rounded-full bg-(--color-surface-muted) ring-1 ring-inset ring-(--color-line)"
    >
      {parts.map(([count, tone], index) => (
        <span
          key={index}
          className={cn("h-full transition-[width] duration-300", tone)}
          style={{ width: `${(count / total) * 100}%` }}
        />
      ))}
    </span>
  );
}

function RosterRow({ row, onOpen, onReport, onRemind }: { row: OversightRow; onOpen: () => void; onReport: () => void; onRemind: () => void }) {
  return (
    <tr className="group transition-colors hover:bg-(--color-surface-muted)/60 max-md:grid max-md:grid-cols-[1fr_auto] max-md:gap-x-3 max-md:gap-y-2 max-md:px-4 max-md:py-3">
      <td className="px-4 py-3 sm:px-5 max-md:p-0">
        <button type="button" onClick={onOpen} className={cn("flex items-center gap-3 rounded-lg text-left", focusRing)}>
          <Initials name={row.person.name} size="sm" />
          <span className="grid min-w-0">
            <span className="truncate font-medium text-(--color-text-strong) group-hover:text-(--color-brand-blue)">
              {row.person.name}
            </span>
            <span className="truncate text-[12px] text-(--color-text-muted)">
              {TIER_LABELS[row.person.tier]} · {row.person.orgUnit}
              {row.supervisorName ? ` · reports to ${row.supervisorName}` : ""}
            </span>
          </span>
        </button>
      </td>
      {REPORT_CATEGORIES.map((category) => (
        <td key={category.key} className="px-2 py-3 max-md:hidden">
          <StatusPill status={row.statuses[category.key]} />
        </td>
      ))}
      <td className="px-2 py-3 max-md:col-start-1 max-md:row-start-2 max-md:flex max-md:items-center max-md:gap-2 max-md:p-0">
        <span className="md:hidden">
          <ReportMark statuses={Object.values(row.statuses)} />
        </span>
        <OverallPill status={row.overall} />
      </td>
      <td className="px-4 py-3 text-right sm:px-5 max-md:col-start-2 max-md:row-span-2 max-md:row-start-1 max-md:self-center max-md:p-0">
        <button type="button" onClick={onReport} aria-label={`View report for ${row.person.name}`} className={cn("mr-2 inline-grid size-8 place-items-center rounded-full border border-(--color-line-strong) text-(--color-brand-blue) hover:bg-(--color-brand-sky-soft)", focusRing)}><FileTextIcon className="size-3.5" aria-hidden /></button>
        {row.overall === "complete" ? (
          <span className="text-[12px] text-(--color-text-muted)">—</span>
        ) : row.reminder ? (
          <span className="text-[12px] text-(--color-text-muted)">Queued</span>
        ) : (
          <button type="button" onClick={onRemind} className={buttonSmall} aria-label={`Queue a reminder for ${row.person.name}`}>
            <BellIcon className="size-3.5" aria-hidden />
            Remind
          </button>
        )}
      </td>
    </tr>
  );
}

function PersonSheet({ personId, onClose }: { personId: string | null; onClose: () => void }) {
  const { state, viewer, day, today, run } = useDemo();
  const row = personId ? oversightRow(state, viewer.id, personId, day) : null;
  const week = trackerDays(day);
  const details = personId ? oversightReport(state, viewer.id, personId, day) : null;

  return (
    <Sheet
      open={Boolean(row)}
      onClose={onClose}
      title={row?.person.name ?? ""}
      description={
        row ? (
          <>
            {TIER_LABELS[row.person.tier]}
            · {row.person.orgUnit}
          </>
        ) : null
      }
      footer={
        row && row.overall !== "complete" ? (
          row.reminder ? null : (
            <button
              type="button"
              className={buttonSmall}
              onClick={() => run((current) => queueReminder(current, viewer.id, row.person.id, day))}
            >
              <BellIcon className="size-3.5" aria-hidden />
              Queue a reminder
            </button>
          )
        ) : null
      }
    >
      {row ? (
        <div className="grid gap-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13.5px] text-(--color-text)">{longDate(day)}</p>
            <OverallPill status={row.overall} />
          </div>

          {!details ? <dl className="grid gap-3">
            {REPORT_CATEGORIES.map((category) => (
              <div key={category.key} className="flex items-center justify-between gap-3">
                <dt className="text-[13.5px] text-(--color-text-strong)">{category.label}</dt>
                <dd>
                  <StatusPill status={row.statuses[category.key]} />
                </dd>
              </div>
            ))}
          </dl> : null}

          {details ? <OversightReportDetails report={details} /> : null}

          <div className="grid gap-2">
            <p className="text-[12.5px] font-medium text-(--color-text-muted)">Last seven days</p>
            <ol className="grid grid-cols-7 gap-1">
              {week.map((key) => (
                <li key={key} className="grid justify-items-center gap-1 text-[11px] text-(--color-text-muted)">
                  {key === today ? "Today" : shortDate(key).split(" ")[0]}
                  <ReportMark size="sm" statuses={Object.values(dayReport(state, row.person.id, key).statuses)} />
                </li>
              ))}
            </ol>
          </div>

          
        </div>
      ) : null}
    </Sheet>
  );
}

