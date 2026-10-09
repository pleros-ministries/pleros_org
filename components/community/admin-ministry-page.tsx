"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ExpandButton } from "@/components/ppc/expandable-table-row";
import { ALL_ACTIVITY_KINDS, type ActivityKind } from "@/lib/community/ministry-activities";
import {
  MINISTRY_FIELDS,
  activityLines,
  daysInRange,
  ministryRangePresets,
  sumMinistryNumbers,
  totalReached,
  type DayActivity,
  type MinistryFieldKey,
  type MinistryNumbers,
} from "@/lib/community/ministry-report";
import { dateKeyLabel } from "@/lib/community/time";
import type {
  DayActivitySummary,
  MemberActivity,
  MinistryDayTotals,
  MinistryMemberTotals,
  StaffMinistryRow,
} from "@/lib/db/queries/ministry-activities";
import type { StaffOutreachContact } from "@/lib/db/queries/outreach-contacts";
import { shiftDate } from "@/lib/sogp/daily-date";

import type { ContactViewer } from "./report/contact-detail";
import { MemberActivityList } from "./report/member-activity-list";
import { OutreachContactBrowser } from "./report/outreach-contact-browser";

export type AdminMinistryMember = {
  userId: string;
  name: string;
  unitName: string | null;
  /** One entry per day of the range, newest first. */
  days: Array<{
    dateKey: string;
    activities: MemberActivity[];
    activity: DayActivitySummary | null;
  }>;
};

type PageParams = {
  date: string;
  from: string;
  to: string;
  unitId: number | null;
  member?: string | null;
};

const BASE = "/admin/ministry";

const controlClass =
  "h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs text-zinc-700";
const linkClass = "text-[var(--color-brand-blue)] underline underline-offset-2";
const tileClass = "grid gap-0.5 rounded-sm border border-zinc-200 bg-white p-3";
const tileLabelClass =
  "text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-zinc-400";
const tileValueClass = "ppc-heading text-base font-semibold text-zinc-900";

function hrefFor(params: PageParams): string {
  const search = new URLSearchParams({
    date: params.date,
    from: params.from,
    to: params.to,
  });
  if (params.unitId != null) search.set("unit", String(params.unitId));
  if (params.member) search.set("member", params.member);
  return `${BASE}?${search.toString()}`;
}

/** The areas with something recorded that day, e.g. "Bible reading · Prayer Watch". */
function activitySummary(activity: DayActivity): string {
  const done = activityLines(activity).filter((line) => line.detail !== null);
  return done.length > 0 ? done.map((line) => line.label).join(" · ") : "—";
}

function activityTitle(activity: DayActivity): string {
  return activityLines(activity)
    .map((line) => `${line.label}: ${line.detail ?? "nothing recorded"}`)
    .join("\n");
}

function rangeActivity(activity: DayActivitySummary | null): string {
  if (!activity) return "—";
  const done = [
    activity.bible ? "Bible reading" : null,
    activity.prayerWatch ? "Prayer Watch" : null,
    activity.sogp ? "SOGP" : null,
    activity.podcastEpisodes > 0 ? "Podcast" : null,
  ].filter(Boolean);
  return done.length > 0 ? done.join(" · ") : "—";
}

/** "Evangelism 12 · Discipleship 4", leaving out kinds with nothing. */
function kindSummary(byKind: Record<ActivityKind, number>): string {
  const parts = ALL_ACTIVITY_KINDS.filter((kind) => byKind[kind.key] > 0).map(
    (kind) => `${kind.label} ${byKind[kind.key]}`,
  );
  return parts.length > 0 ? parts.join(" · ") : "No activities";
}

function sumKinds(rows: Array<{ byKind: Record<ActivityKind, number> }>) {
  const total = {} as Record<ActivityKind, number>;
  for (const kind of ALL_ACTIVITY_KINDS) {
    total[kind.key] = rows.reduce((sum, row) => sum + row.byKind[kind.key], 0);
  }
  return total;
}

// ─── Sorting ───────────────────────────────────────────────────────────────

type SortKey = "label" | "days" | "members" | "activities" | "reached" | MinistryFieldKey;
type SortState = { key: SortKey; descending: boolean };

type SortableRow = MinistryNumbers & {
  activities: number;
  days?: number;
  members?: number;
};

function sortValue(row: SortableRow, label: string, key: SortKey): number | string {
  if (key === "label") return label;
  if (key === "days") return row.days ?? 0;
  if (key === "members") return row.members ?? 0;
  if (key === "activities") return row.activities;
  if (key === "reached") return totalReached(row);
  return row[key];
}

/** Sorts rows by a column; `labelOf` supplies the text column (name or date). */
function sortRows<T extends SortableRow>(
  rows: T[],
  sort: SortState,
  labelOf: (row: T) => string,
): T[] {
  return [...rows].sort((a, b) => {
    const left = sortValue(a, labelOf(a), sort.key);
    const right = sortValue(b, labelOf(b), sort.key);
    const order =
      typeof left === "string" && typeof right === "string"
        ? left.localeCompare(right)
        : Number(left) - Number(right);
    // Ties fall back to the text column so the order is stable.
    const settled = order !== 0 ? order : labelOf(a).localeCompare(labelOf(b));
    return sort.descending ? -settled : settled;
  });
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (sort: SortState) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === sortKey;
  return (
    <th
      aria-sort={active ? (sort.descending ? "descending" : "ascending") : "none"}
      className={`px-2 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() =>
          onSort({
            key: sortKey,
            // A fresh column starts with the biggest numbers first; names start A to Z.
            descending: active ? !sort.descending : sortKey !== "label",
          })
        }
        className={`inline-flex items-center gap-1 hover:text-zinc-900 ${
          active ? "font-semibold text-zinc-900" : ""
        }`}
      >
        {label}
        <span aria-hidden className="text-[0.6rem]">
          {active ? (sort.descending ? "▼" : "▲") : ""}
        </span>
      </button>
    </th>
  );
}

function NumberCells({ row }: { row: MinistryNumbers | null }) {
  return (
    <>
      {MINISTRY_FIELDS.map((field) => (
        <td key={field.key} className="px-2 py-2 text-right tabular-nums">
          {row ? row[field.key] : "–"}
        </td>
      ))}
    </>
  );
}

function NumberHeaders() {
  return (
    <>
      {MINISTRY_FIELDS.map((field) => (
        <th key={field.key} className="px-2 py-2 text-right font-medium">
          {field.short}
        </th>
      ))}
    </>
  );
}

function Tiles({
  leading,
  totals,
}: {
  leading: Array<{ label: string; value: number; sub?: string }>;
  totals: MinistryNumbers;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {leading.map((tile) => (
        <div key={tile.label} className={tileClass}>
          <span className={tileLabelClass}>{tile.label}</span>
          <span className={tileValueClass}>
            {tile.value}
            {tile.sub ? (
              <span className="text-xs font-normal text-zinc-400"> {tile.sub}</span>
            ) : null}
          </span>
        </div>
      ))}
      {MINISTRY_FIELDS.map((field) => (
        <div key={field.key} className={tileClass}>
          <span className={tileLabelClass}>{field.short}</span>
          <span className={tileValueClass}>{totals[field.key]}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Ministry activities for admins: a date range with sortable totals per
 * member and per day and the people met in it, one day across every member,
 * and one member's own days. Numbers are shown as entered.
 */
export function AdminMinistryPage({
  today,
  dateKey,
  range,
  unitId,
  units,
  rows,
  totalsByDay,
  totalsByMember,
  contacts,
  contactLimitReached,
  member,
  viewer,
}: {
  today: string;
  /** The single day shown in the day table. */
  dateKey: string;
  range: { from: string; to: string };
  unitId: number | null;
  units: Array<{ id: number; name: string }>;
  rows: StaffMinistryRow[];
  totalsByDay: MinistryDayTotals[];
  totalsByMember: MinistryMemberTotals[];
  contacts: StaffOutreachContact[];
  /** True when the range holds more people than were loaded. */
  contactLimitReached: boolean;
  member: AdminMinistryMember | null;
  viewer: ContactViewer;
}) {
  const router = useRouter();
  const [everyone, setEveryone] = useState(false);
  const [memberSort, setMemberSort] = useState<SortState>({
    key: "reached",
    descending: true,
  });
  const [daySort, setDaySort] = useState<SortState>({
    key: "label",
    descending: true,
  });
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const params: PageParams = { date: dateKey, ...range, unitId };
  const go = (next: Partial<PageParams>) => router.push(hrefFor({ ...params, ...next }));

  const reported = rows.filter((row) => row.totals !== null);
  const visible = everyone ? rows : reported;
  const dayActivities = reported.flatMap((row) => row.activities);
  const dayTotals = sumMinistryNumbers(dayActivities);
  const dayKinds = {} as Record<ActivityKind, number>;
  for (const kind of ALL_ACTIVITY_KINDS) {
    dayKinds[kind.key] = dayActivities.filter((activity) => activity.kind === kind.key).length;
  }
  const rangeTotals = sumMinistryNumbers(totalsByDay);
  const rangeActivities = totalsByDay.reduce((sum, day) => sum + day.activities, 0);
  const rangeKinds = sumKinds(totalsByDay);
  const sortedMembers = sortRows(totalsByMember, memberSort, (row) => row.name);
  const sortedDays = sortRows(totalsByDay, daySort, (row) => row.dateKey);
  const columns = MINISTRY_FIELDS.length;
  const exportUnit = unitId != null ? `&unit=${unitId}` : "";

  return (
    <div className="grid gap-5">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          Ministry reports
        </h1>
        <p className="text-xs text-zinc-500">
          What members log each day, beside what they did on Pleros. The
          numbers are as each person entered them. Reached counts people
          reached online, reached offline and present at meetings.
        </p>
      </header>

      {/* ── Date range ─────────────────────────────────────────────────── */}
      <section className="grid gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-medium text-zinc-700">
            From
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(event) => event.target.value && go({ from: event.target.value })}
              className={controlClass}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-zinc-700">
            To
            <input
              type="date"
              value={range.to}
              min={range.from}
              max={today}
              onChange={(event) => event.target.value && go({ to: event.target.value })}
              className={controlClass}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-zinc-700">
            Location group
            <select
              value={unitId ?? ""}
              onChange={(event) =>
                go({ unitId: event.target.value ? Number(event.target.value) : null })
              }
              className={controlClass}
            >
              <option value="">All groups</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>
          <a
            href={`/api/admin/ministry/export?from=${range.from}&to=${range.to}${exportUnit}`}
            className={`${controlClass} ml-auto inline-flex items-center font-medium`}
          >
            Export this range
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {ministryRangePresets(today).map((preset) => {
            const active = preset.from === range.from && preset.to === range.to;
            return (
              <Link
                key={preset.label}
                href={hrefFor({ ...params, from: preset.from, to: preset.to })}
                scroll={false}
                className={active ? "font-semibold text-zinc-900" : linkClass}
              >
                {preset.label}
              </Link>
            );
          })}
          <span className="text-zinc-400">
            {dateKeyLabel(range.from)} to {dateKeyLabel(range.to)} ·{" "}
            {daysInRange(range.from, range.to)} days
          </span>
        </div>

        <Tiles
          leading={[
            { label: "Activities", value: rangeActivities },
            { label: "Reached", value: totalReached(rangeTotals) },
          ]}
          totals={rangeTotals}
        />
        <p className="text-xs text-zinc-500">By kind: {kindSummary(rangeKinds)}</p>
      </section>

      {member ? (
        <section className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
              {member.name}
              <span className="font-normal text-zinc-500">
                {member.unitName ? ` · ${member.unitName}` : ""} · day by day
              </span>
            </h2>
            <Link href={hrefFor(params)} scroll={false} className={`${linkClass} text-xs`}>
              Close
            </Link>
          </div>
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Day</th>
                  <th className="px-2 py-2 text-right font-medium">Activities</th>
                  <th className="px-2 py-2 text-right font-medium">Reached</th>
                  <NumberHeaders />
                  <th className="px-3 py-2 font-medium">On Pleros</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {member.days.map((day) => {
                  const totals =
                    day.activities.length > 0 ? sumMinistryNumbers(day.activities) : null;
                  const open = expandedDay === day.dateKey;
                  const detailId = `member-day-${day.dateKey}`;
                  return (
                    <Fragment key={day.dateKey}>
                      <tr className={totals ? "" : "text-zinc-400"}>
                        <td className="whitespace-nowrap px-3 py-2 font-medium">
                          {dateKeyLabel(day.dateKey)}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {totals ? day.activities.length : "–"}
                        </td>
                        <td className="px-2 py-2 text-right font-medium tabular-nums">
                          {totals ? totalReached(totals) : "–"}
                        </td>
                        <NumberCells row={totals} />
                        <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                          {rangeActivity(day.activity)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {totals ? (
                            <ExpandButton
                              expanded={open}
                              controls={detailId}
                              label={`activities on ${dateKeyLabel(day.dateKey)}`}
                              onToggle={() => setExpandedDay(open ? null : day.dateKey)}
                            />
                          ) : null}
                        </td>
                      </tr>
                      {open ? (
                        <tr id={detailId} className="bg-zinc-50/60">
                          <td colSpan={columns + 5} className="px-3 py-2.5">
                            <MemberActivityList activities={day.activities} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* ── Members over the range ─────────────────────────────────────── */}
      <section className="grid gap-2">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          By member ({totalsByMember.length})
          <span className="font-normal text-zinc-500"> · click a column to sort</span>
        </h2>
        <div className="max-h-[32rem] overflow-auto rounded-sm border border-zinc-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
              <tr>
                <SortHeader label="Member" sortKey="label" sort={memberSort} onSort={setMemberSort} align="left" />
                <th className="px-2 py-2 font-medium">Group</th>
                <SortHeader label="Days" sortKey="days" sort={memberSort} onSort={setMemberSort} />
                <SortHeader label="Activities" sortKey="activities" sort={memberSort} onSort={setMemberSort} />
                <SortHeader label="Reached" sortKey="reached" sort={memberSort} onSort={setMemberSort} />
                {MINISTRY_FIELDS.map((field) => (
                  <SortHeader key={field.key} label={field.short} sortKey={field.key} sort={memberSort} onSort={setMemberSort} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={columns + 5} className="px-3 py-6 text-center text-zinc-500">
                    No activities in this range.
                  </td>
                </tr>
              ) : (
                sortedMembers.map((row) => (
                  <tr key={row.userId}>
                    <td className="whitespace-nowrap px-2 py-2 font-medium">
                      <Link
                        href={hrefFor({ ...params, member: row.userId })}
                        scroll={false}
                        className={linkClass}
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">{row.unitName ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.days}</td>
                    <td className="px-2 py-2 text-right tabular-nums" title={kindSummary(row.byKind)}>
                      {row.activities}
                    </td>
                    <td className="px-2 py-2 text-right font-medium tabular-nums">
                      {totalReached(row)}
                    </td>
                    <NumberCells row={row} />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Days in the range ──────────────────────────────────────────── */}
      <section className="grid gap-2">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          Day by day
          <span className="font-normal text-zinc-500"> · days with at least one activity</span>
        </h2>
        <div className="max-h-[32rem] overflow-auto rounded-sm border border-zinc-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
              <tr>
                <SortHeader label="Day" sortKey="label" sort={daySort} onSort={setDaySort} align="left" />
                <SortHeader label="Members" sortKey="members" sort={daySort} onSort={setDaySort} />
                <SortHeader label="Activities" sortKey="activities" sort={daySort} onSort={setDaySort} />
                <SortHeader label="Reached" sortKey="reached" sort={daySort} onSort={setDaySort} />
                {MINISTRY_FIELDS.map((field) => (
                  <SortHeader key={field.key} label={field.short} sortKey={field.key} sort={daySort} onSort={setDaySort} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sortedDays.length === 0 ? (
                <tr>
                  <td colSpan={columns + 4} className="px-3 py-6 text-center text-zinc-500">
                    No activities in this range.
                  </td>
                </tr>
              ) : (
                sortedDays.map((day) => (
                  <tr key={day.dateKey}>
                    <td className="whitespace-nowrap px-2 py-2 font-medium">
                      <Link
                        href={hrefFor({ ...params, date: day.dateKey })}
                        scroll={false}
                        className={linkClass}
                      >
                        {dateKeyLabel(day.dateKey)}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{day.members}</td>
                    <td className="px-2 py-2 text-right tabular-nums" title={kindSummary(day.byKind)}>
                      {day.activities}
                    </td>
                    <td className="px-2 py-2 text-right font-medium tabular-nums">
                      {totalReached(day)}
                    </td>
                    <NumberCells row={day} />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── People met in the range ────────────────────────────────────── */}
      <section className="grid gap-2">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          People met in ministry
          {member ? (
            <span className="font-normal text-zinc-500"> · by {member.name}</span>
          ) : null}
        </h2>
        {contactLimitReached ? (
          <p className="rounded-sm border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            This range has more people than can be listed at once, so only the
            most recent are shown. Narrow the range, or export it to get
            everyone.
          </p>
        ) : null}
        <div className="max-h-[36rem] overflow-auto rounded-sm border border-zinc-200 bg-white">
          <OutreachContactBrowser
            contacts={contacts}
            today={today}
            viewer={viewer}
            staff
            defaultStatus="pending"
            emptyText="No one has been recorded in this range."
          />
        </div>
      </section>

      {/* ── One day, every member ──────────────────────────────────────── */}
      <section className="grid gap-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            One day: {dateKeyLabel(dateKey)}
            {dateKey === today ? " (today)" : ""}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={hrefFor({ ...params, date: shiftDate(dateKey, -1) })}
              scroll={false}
              className={`${controlClass} inline-flex items-center`}
            >
              Previous day
            </Link>
            <input
              type="date"
              aria-label="Day"
              value={dateKey}
              max={today}
              onChange={(event) => event.target.value && go({ date: event.target.value })}
              className={controlClass}
            />
            {dateKey < today ? (
              <Link
                href={hrefFor({ ...params, date: shiftDate(dateKey, 1) })}
                scroll={false}
                className={`${controlClass} inline-flex items-center`}
              >
                Next day
              </Link>
            ) : null}
            <a
              href={`/api/admin/ministry/export?date=${dateKey}${exportUnit}`}
              className={`${controlClass} inline-flex items-center font-medium`}
            >
              Export this day
            </a>
          </div>
        </div>

        <Tiles
          leading={[
            { label: "Reported", value: reported.length, sub: `of ${rows.length}` },
            { label: "Activities", value: dayActivities.length },
          ]}
          totals={dayTotals}
        />
        <p className="text-xs text-zinc-500">By kind: {kindSummary(dayKinds)}</p>

        <label className="flex items-center gap-1.5 text-xs text-zinc-600">
          <input
            type="checkbox"
            checked={everyone}
            onChange={(event) => setEveryone(event.target.checked)}
            className="size-3.5 accent-[var(--color-brand-blue)]"
          />
          Show members who logged nothing
        </label>
        <div className="overflow-x-auto rounded-sm border border-zinc-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Member</th>
                <th className="px-3 py-2 font-medium">Group</th>
                <th className="px-2 py-2 text-right font-medium">Activities</th>
                <th className="px-2 py-2 text-right font-medium">Reached</th>
                <NumberHeaders />
                <th className="px-3 py-2 font-medium">On Pleros</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={columns + 6} className="px-3 py-6 text-center text-zinc-500">
                    {rows.length === 0
                      ? "No members in this group."
                      : "No activities for this day yet."}
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const open = expandedMember === row.userId;
                  const detailId = `day-member-${row.userId}`;
                  return (
                    <Fragment key={row.userId}>
                      <tr className={row.totals ? "" : "text-zinc-400"}>
                        <td className="whitespace-nowrap px-3 py-2 font-medium">
                          <Link
                            href={hrefFor({ ...params, member: row.userId })}
                            scroll={false}
                            className={linkClass}
                          >
                            {row.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">{row.unitName ?? "—"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {row.totals ? row.activities.length : "–"}
                        </td>
                        <td className="px-2 py-2 text-right font-medium tabular-nums">
                          {row.totals ? totalReached(row.totals) : "–"}
                        </td>
                        <NumberCells row={row.totals} />
                        <td
                          className="whitespace-nowrap px-3 py-2 text-zinc-600"
                          title={activityTitle(row.activity)}
                        >
                          {activitySummary(row.activity)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {row.totals ? (
                            <ExpandButton
                              expanded={open}
                              controls={detailId}
                              label={`activities for ${row.name}`}
                              onToggle={() => setExpandedMember(open ? null : row.userId)}
                            />
                          ) : null}
                        </td>
                      </tr>
                      {open ? (
                        <tr id={detailId} className="bg-zinc-50/60">
                          <td colSpan={columns + 6} className="px-3 py-2.5">
                            <MemberActivityList activities={row.activities} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
