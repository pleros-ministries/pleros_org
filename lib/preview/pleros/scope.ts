import {
  emptyMinistryNumbers,
  sumMinistryNumbers,
  totalReached,
  type MinistryNumbers,
} from "@/lib/community/ministry-report";

import { REPORT_CATEGORIES, dayReport, recordedLines } from "./daily-report";
import type {
  CategoryStatus,
  DemoContact,
  DemoGroup,
  DemoPerson,
  DemoReminder,
  DemoState,
  OrgTier,
  OverallStatus,
  ReportCategory,
} from "./types";

/**
 * Who sits where, and what a viewer may see about the people below them.
 * Oversight here is illustrative and pending an approved policy: it shows
 * reporting status and summed numbers, never notes, contacts, prayers,
 * messages, check-in answers or devotional detail.
 */

export const TIER_LABELS: Record<OrgTier, string> = {
  pastor: "Pastor",
  pastorate: "Branch Pastor",
  unit_leader: "Unit leader",
  worker: "Worker",
  disciple: "Disciple",
};

/** Tier labels whose wording is still to be confirmed with the ministry. */
export const TIER_LABEL_TO_CONFIRM: ReadonlySet<OrgTier> = new Set();

export const TIER_ORDER: readonly OrgTier[] = [
  "pastor",
  "pastorate",
  "unit_leader",
  "worker",
  "disciple",
];

export function findPerson(state: DemoState, id: string): DemoPerson | undefined {
  return state.people.find((person) => person.id === id);
}

/** True for anyone on the organisational roster, who is expected to report daily. */
export function expectsReport(person: DemoPerson): boolean {
  return person.tier !== "disciple";
}

export function directReports(state: DemoState, id: string): DemoPerson[] {
  return state.people.filter((person) => person.supervisorId === id);
}

/**
 * Everyone below a person, each once. A visited set keeps a cycle or a
 * person reached twice from counting twice.
 */
export function scopeIds(state: DemoState, id: string): string[] {
  const seen = new Set<string>([id]);
  const order: string[] = [];
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const report of directReports(state, current)) {
      if (seen.has(report.id)) continue;
      seen.add(report.id);
      order.push(report.id);
      queue.push(report.id);
    }
  }
  return order;
}

export function oversees(state: DemoState, viewerId: string, subjectId: string): boolean {
  return viewerId !== subjectId && scopeIds(state, viewerId).includes(subjectId);
}

/** Scope navigation never changes the viewer or widens their allowed subtree. */
export function resolveOversightScope(state: DemoState, viewerId: string, scopeId?: string | null): DemoPerson | null {
  const target = scopeId || viewerId;
  if (target !== viewerId && !oversees(state, viewerId, target)) return null;
  return findPerson(state, target) ?? null;
}

/** The people above a person, nearest first. */
export function supervisorChain(state: DemoState, id: string): DemoPerson[] {
  const chain: DemoPerson[] = [];
  const seen = new Set<string>([id]);
  let current = findPerson(state, id)?.supervisorId ?? null;
  while (current && !seen.has(current)) {
    seen.add(current);
    const person = findPerson(state, current);
    if (!person) break;
    chain.push(person);
    current = person.supervisorId;
  }
  return chain;
}

// ─── Discipleship (personal, never organisational) ─────────────────────────

export function ledGroups(state: DemoState, leaderId: string): DemoGroup[] {
  return state.groups.filter((group) => group.leaderId === leaderId);
}

/** Groups that still count against the five-group limit: active and paused. */
export function openLedGroups(state: DemoState, leaderId: string): DemoGroup[] {
  return ledGroups(state, leaderId).filter((group) => group.status !== "closed");
}

export function groupMemberIds(state: DemoState, groupId: number): string[] {
  return state.memberships
    .filter((membership) => membership.groupId === groupId && membership.status === "active")
    .map((membership) => membership.personId);
}

/** The one group a person belongs to, if any. */
export function joinedGroup(state: DemoState, personId: string): DemoGroup | null {
  const membership = state.memberships.find(
    (row) => row.personId === personId && row.status === "active",
  );
  if (!membership) return null;
  return state.groups.find((group) => group.id === membership.groupId) ?? null;
}

/** Each disciple across a leader's open groups, once. */
export function discipleIds(state: DemoState, leaderId: string): string[] {
  const ids = new Set<string>();
  for (const group of openLedGroups(state, leaderId)) {
    for (const id of groupMemberIds(state, group.id)) ids.add(id);
  }
  return [...ids];
}

export type Responsibilities = {
  oversight: string[];
  disciples: string[];
  /** People who are both in the oversight scope and a disciple. */
  overlap: number;
  /** Everyone the person is responsible for, each counted once. */
  uniquePeople: number;
  /** Organisational role assignments in scope (one per person in this demo). */
  roleAssignments: number;
  /** Active memberships across the open led groups. */
  groupMemberships: number;
};

export function responsibilities(state: DemoState, id: string): Responsibilities {
  const oversight = scopeIds(state, id);
  const disciples = discipleIds(state, id);
  const union = new Set([...oversight, ...disciples]);
  const groupMemberships = openLedGroups(state, id).reduce(
    (count, group) => count + groupMemberIds(state, group.id).length,
    0,
  );
  return {
    oversight,
    disciples,
    overlap: oversight.length + disciples.length - union.size,
    uniquePeople: union.size,
    roleAssignments: oversight.length,
    groupMemberships,
  };
}

// ─── Reporting coverage ────────────────────────────────────────────────────

export type Coverage = {
  /** Unique people on the roster expected to report. */
  expected: number;
  overall: Record<OverallStatus, number>;
  byCategory: Record<ReportCategory, Record<CategoryStatus, number>>;
  /** Summed recorded numbers. Reach and attendance are not unique people. */
  numbers: MinistryNumbers;
  recordedReach: number;
  activityCount: number;
};

function emptyCounts(): Record<CategoryStatus, number> {
  return { activity: 0, nil: 0, missing: 0 };
}

export function coverage(state: DemoState, ids: Iterable<string>, dateKey: string): Coverage {
  const unique = [...new Set(ids)]
    .map((id) => findPerson(state, id))
    .filter((person): person is DemoPerson => Boolean(person && expectsReport(person)));

  const result: Coverage = {
    expected: unique.length,
    overall: { complete: 0, in_progress: 0, not_started: 0 },
    byCategory: {
      devotional: emptyCounts(),
      ministry: emptyCounts(),
      meetings: emptyCounts(),
    },
    numbers: emptyMinistryNumbers(),
    recordedReach: 0,
    activityCount: 0,
  };
  const rows: MinistryNumbers[] = [];
  for (const person of unique) {
    const report = dayReport(state, person.id, dateKey);
    result.overall[report.overall] += 1;
    for (const category of REPORT_CATEGORIES) {
      result.byCategory[category.key][report.statuses[category.key]] += 1;
    }
    rows.push(report.numbers);
    result.activityCount += report.ministry.length + report.meetings.length;
  }
  result.numbers = sumMinistryNumbers(rows);
  result.recordedReach = totalReached(result.numbers);
  return result;
}

export type ScopeBranch = {
  lead: DemoPerson;
  /** The lead and everyone below them, each once. */
  ids: string[];
  coverage: Coverage;
};

/** One row per direct report, rolling up their whole branch. */
export function scopeBranches(state: DemoState, viewerId: string, dateKey: string): ScopeBranch[] {
  return directReports(state, viewerId).map((lead) => {
    const ids = [lead.id, ...scopeIds(state, lead.id)];
    return { lead, ids, coverage: coverage(state, ids, dateKey) };
  });
}

// ─── What a supervisor may see about one person ────────────────────────────

export type OversightRow = {
  person: DemoPerson;
  /** Who this person reports to, for rows deeper than the viewer's direct reports. */
  supervisorName: string | null;
  statuses: Record<ReportCategory, CategoryStatus>;
  overall: OverallStatus;
  /** Which devotional sources have something recorded; never what was recorded. */
  devotionSources: Array<{ key: string; label: string; recorded: boolean }>;
  activityCount: number;
  recordedReach: number;
  attendance: number;
  followUps: number;
  saved: number;
  reminder: DemoReminder | null;
};

export function groupOversightRows(state: DemoState, rows: OversightRow[]): Array<{
  id: string;
  leader: DemoPerson | null;
  label: string;
  rows: OversightRow[];
}> {
  const groups = new Map<string, { id: string; leader: DemoPerson | null; label: string; rows: OversightRow[] }>();
  for (const row of rows) {
    const leader = [row.person, ...supervisorChain(state, row.person.id)].find((person) => person.tier === "unit_leader") ?? null;
    const id = leader?.id ?? "leadership";
    if (!groups.has(id)) groups.set(id, { id, leader, label: leader?.orgUnit ?? "Pastoral leadership", rows: [] });
    groups.get(id)!.rows.push(row);
  }
  return [...groups.values()];
}

/**
 * A person's day as their supervisor sees it, or null when the viewer does
 * not oversee them. Built field by field so notes, contacts and devotional
 * detail cannot leak through a spread.
 */
export function oversightRow(
  state: DemoState,
  viewerId: string,
  subjectId: string,
  dateKey: string,
): OversightRow | null {
  if (!oversees(state, viewerId, subjectId)) return null;
  const person = findPerson(state, subjectId);
  if (!person || !expectsReport(person)) return null;
  const report = dayReport(state, subjectId, dateKey);
  const recorded = new Set(recordedLines(report.devotion).map((line) => line.key));
  const supervisor = person.supervisorId ? findPerson(state, person.supervisorId) : undefined;
  return {
    person,
    supervisorName: supervisor && supervisor.id !== viewerId ? supervisor.name : null,
    statuses: report.statuses,
    overall: report.overall,
    devotionSources: report.devotionLines.map((line) => ({
      key: line.key,
      label: line.label,
      recorded: recorded.has(line.key),
    })),
    activityCount: report.ministry.length + report.meetings.length,
    recordedReach: report.numbers.reachedOnline + report.numbers.reachedOffline,
    attendance: report.numbers.attendance,
    followUps: report.numbers.followUps,
    saved: report.numbers.saved,
    reminder:
      state.reminders.find(
        (reminder) =>
          reminder.byId === viewerId &&
          reminder.subjectId === subjectId &&
          reminder.dateKey === dateKey,
      ) ?? null,
  };
}

export function oversightRows(
  state: DemoState,
  viewerId: string,
  ids: string[],
  dateKey: string,
): OversightRow[] {
  return [...new Set(ids)]
    .map((id) => oversightRow(state, viewerId, id, dateKey))
    .filter((row): row is OversightRow => row !== null);
}

/** Contacts stay with the person who met them. Nobody inherits them through the hierarchy. */
export function canSeeContact(viewerId: string, contact: DemoContact): boolean {
  return contact.ownerId === viewerId;
}

export function contactsFor(state: DemoState, viewerId: string): DemoContact[] {
  return state.contacts.filter((contact) => canSeeContact(viewerId, contact));
}
