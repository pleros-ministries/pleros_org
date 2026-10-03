"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import {
  moveEnrolleesToCohort,
  recordFollowUpContact,
  setCohortMoveResponse,
  setEnrolleeFullness,
} from "@/app/admin/(app)/(pastor-only)/_actions/pastor-followup-actions";
import {
  CohortMoveConfirmDialog,
  CohortMoveControls,
  CohortMoveTag,
} from "@/components/ppc/cohort-move-controls";
import { FollowUpMessageDialog } from "@/components/ppc/follow-up-message-dialog";
import { PageHeader } from "@/components/ppc/page-header";
import { PastorDailyParticipationSection } from "@/components/ppc/pastor-daily-participation";
import type { PastorCohortWindow, PastorEnrollee } from "@/lib/db/queries/pastor-followups";
import {
  COHORT_MOVE_FILTER_OPTIONS,
  cohortMoveLabel,
  getCohortMoveBlocker,
  matchesCohortMoveFilter,
  type CohortMoveFilter,
  type CohortMoveState,
  type CohortMoveTarget,
} from "@/lib/sogp/cohort-move";
import { ALL_PASTORS } from "@/lib/sogp/daily-participation";
import {
  FULLNESS_FILTER_OPTIONS,
  fullnessLabel,
  fullnessRank,
  matchesFullnessFilter,
  type FullnessFilter,
  type FullnessMembership,
} from "@/lib/sogp/fullness";
import {
  INACTIVE_STUDENT_STATUSES,
  STUDENT_STATUS_META,
  type StudentStatus,
} from "@/lib/sogp/student-status";

type SortKey = "recent" | "name" | "least-contacted" | "lowest-progress" | "fullness";

type StatusFilter = "all" | "not_active" | StudentStatus;

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "not_active", label: "Not active" },
  ...(Object.keys(STUDENT_STATUS_META) as StudentStatus[]).map((status) => ({
    value: status,
    label: STUDENT_STATUS_META[status].label,
  })),
];

function matchesStatusFilter(status: StudentStatus, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "not_active") return INACTIVE_STUDENT_STATUSES.includes(status);
  return status === filter;
}

type CohortMoveStates = Record<number, CohortMoveState>;

function canMoveTo(enrollee: PastorEnrollee, target: CohortMoveTarget | null): boolean {
  return target !== null && getCohortMoveBlocker(enrollee, target) === null;
}

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Recently assigned",
  name: "Name (A–Z)",
  "least-contacted": "Least contacted",
  "lowest-progress": "Needs most attention (lowest progress)",
  fullness: "Fullness first",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

const CSV_COLUMNS: Array<{
  header: string;
  value: (enrollee: PastorEnrollee, moveStates: CohortMoveStates) => string | number;
}> = [
  { header: "Name", value: (e) => e.name },
  { header: "Email", value: (e) => e.email },
  { header: "Phone", value: (e) => e.phone },
  { header: "Country", value: (e) => e.country },
  { header: "Region", value: (e) => e.region },
  { header: "Birth year", value: (e) => e.birthYear ?? "" },
  { header: "Cohort", value: (e) => e.cohortTitle },
  { header: "Enrollment status", value: (e) => e.status.replaceAll("_", " ") },
  { header: "Follow-up status", value: (e) => STUDENT_STATUS_META[e.followUpStatus].label },
  { header: "Fullness", value: (e) => fullnessLabel(e.fullness) },
  {
    header: "Cohort move",
    value: (e, moveStates) =>
      moveStates[e.enrollmentId] ? cohortMoveLabel(moveStates[e.enrollmentId]) : "",
  },
  { header: "Pastor", value: (e) => e.pastorName ?? "Unassigned" },
  { header: "Referral source", value: (e) => e.referralSource },
  { header: "Assigned at", value: (e) => e.assignedAt },
  { header: "Contact count", value: (e) => e.contactCount },
  { header: "Last contacted at", value: (e) => e.lastContactedAt ?? "" },
  { header: "WhatsApp consent", value: (e) => (e.whatsappConsent ? "Yes" : "No") },
  { header: "Prep days complete", value: (e) => e.preparationDaysComplete },
  { header: "Prep days total", value: (e) => e.preparationDaysTotal },
  { header: "Morning prayer days", value: (e) => e.morningPrayerDays },
  { header: "Review sessions complete", value: (e) => e.reviewSessionsComplete },
  { header: "Quizzes passed", value: (e) => e.quizzesPassed },
  { header: "Quizzes total", value: (e) => e.quizzesTotal },
  { header: "Responses approved", value: (e) => e.responsesApproved },
  { header: "Certificate issued", value: (e) => (e.certificateIssued ? "Yes" : "No") },
  { header: "Referred count", value: (e) => e.referredCount },
];

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function enrolleesToCsv(enrollees: PastorEnrollee[], moveStates: CohortMoveStates): string {
  const rows = [
    CSV_COLUMNS.map((column) => csvCell(column.header)).join(","),
    ...enrollees.map((enrollee) =>
      CSV_COLUMNS.map((column) => csvCell(column.value(enrollee, moveStates))).join(","),
    ),
  ];
  return rows.join("\n");
}

function downloadEnrolleesCsv(enrollees: PastorEnrollee[], moveStates: CohortMoveStates) {
  const csv = enrolleesToCsv(enrollees, moveStates);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `enrollees-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function progressScore(enrollee: PastorEnrollee): number {
  return (
    enrollee.preparationDaysComplete / enrollee.preparationDaysTotal +
    (enrollee.morningPrayerDays > 0 ? 1 : 0) +
    (enrollee.reviewSessionsComplete > 0 ? 1 : 0) +
    (enrollee.quizzesTotal > 0 ? enrollee.quizzesPassed / enrollee.quizzesTotal : 0)
  );
}

function sortEnrollees(enrollees: PastorEnrollee[], sortKey: SortKey): PastorEnrollee[] {
  const sorted = [...enrollees];
  switch (sortKey) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "least-contacted":
      return sorted.sort((a, b) => {
        if (a.contactCount !== b.contactCount) return a.contactCount - b.contactCount;
        return (a.lastContactedAt ?? "").localeCompare(b.lastContactedAt ?? "");
      });
    case "lowest-progress":
      return sorted.sort((a, b) => progressScore(a) - progressScore(b));
    case "fullness":
      return sorted.sort(
        (a, b) => fullnessRank(a.fullness) - fullnessRank(b.fullness) || a.name.localeCompare(b.name),
      );
    default:
      return sorted.sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
  }
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid gap-0.5 rounded-sm border border-zinc-200 bg-white p-3">
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
        {label}
      </span>
      <span className="ppc-heading text-base font-semibold text-zinc-900">{value}</span>
    </div>
  );
}

function ProgressSummary({ enrollees, totalLabel }: { enrollees: PastorEnrollee[]; totalLabel: string }) {
  const summary = useMemo(() => {
    const buckets = { none: 0, some: 0, done: 0 };
    let morningPrayerActive = 0;
    let quizzesDone = 0;
    let responsesApproved = 0;
    let certified = 0;
    let referring = 0;
    let notContacted = 0;
    let completed = 0;
    for (const enrollee of enrollees) {
      if (enrollee.preparationDaysComplete === 0) buckets.none += 1;
      else if (enrollee.preparationDaysComplete >= enrollee.preparationDaysTotal)
        buckets.done += 1;
      else buckets.some += 1;
      if (enrollee.morningPrayerDays > 0) morningPrayerActive += 1;
      if (enrollee.quizzesTotal > 0 && enrollee.quizzesPassed >= enrollee.quizzesTotal)
        quizzesDone += 1;
      if (enrollee.responsesApproved > 0) responsesApproved += 1;
      if (enrollee.certificateIssued) certified += 1;
      if (enrollee.referredCount > 0) referring += 1;
      if (enrollee.contactCount === 0) notContacted += 1;
      if (enrollee.status === "completed") completed += 1;
    }
    return {
      buckets,
      morningPrayerActive,
      quizzesDone,
      responsesApproved,
      certified,
      referring,
      notContacted,
      completed,
    };
  }, [enrollees]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <Stat label={totalLabel} value={enrollees.length} />
      <Stat label="Prep complete" value={summary.buckets.done} />
      <Stat label="Prep started" value={summary.buckets.some} />
      <Stat label="Morning prayer active" value={summary.morningPrayerActive} />
      <Stat label="Quizzes passed" value={summary.quizzesDone} />
      <Stat label="Responses approved" value={summary.responsesApproved} />
      <Stat label="Certified" value={summary.certified} />
      <Stat label="Referring" value={summary.referring} />
      <Stat label="Not yet contacted" value={summary.notContacted} />
      <Stat label="Completed SOGP" value={summary.completed} />
    </div>
  );
}

function FullnessTag({ value }: { value: FullnessMembership | null }) {
  if (!value) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${
        value === "fullness"
          ? "border-sky-200 bg-sky-50 text-[var(--color-brand-blue)]"
          : "border-zinc-200 bg-white text-zinc-600"
      }`}
    >
      {fullnessLabel(value)}
    </span>
  );
}

export function FullnessSelect({
  value,
  disabled,
  onChange,
  label,
}: {
  value: FullnessMembership | null;
  disabled?: boolean;
  onChange: (value: FullnessMembership | null) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange((event.target.value || null) as FullnessMembership | null)}
      className={`h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs disabled:opacity-60 ${
        value ? "text-zinc-800" : "text-zinc-400"
      }`}
    >
      <option value="">Not set</option>
      <option value="fullness">Fullness</option>
      <option value="non_fullness">Non-Fullness</option>
    </select>
  );
}

function EnrolleeRow({
  enrollee,
  isAdmin,
  showPastor,
  selected,
  onSelectedChange,
  onSetFullness,
  fullnessPending,
  moveTarget,
  moveState,
}: {
  enrollee: PastorEnrollee;
  isAdmin: boolean;
  showPastor: boolean;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onSetFullness: (value: FullnessMembership | null) => void;
  fullnessPending: boolean;
  /** The cohort this enrollee can move to, or null when the move isn't open to them. */
  moveTarget: CohortMoveTarget | null;
  moveState: CohortMoveState | undefined;
}) {
  const [pending, startTransition] = useTransition();
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const statusMeta = STUDENT_STATUS_META[enrollee.followUpStatus];

  function logContact(channel: "call") {
    // Contacts are logged against the enrollee's pastor; unassigned enrollees
    // can still be called, there's just no queue to record it in.
    if (isAdmin && !enrollee.pastorUserId) return;
    startTransition(async () => {
      const result = await recordFollowUpContact({
        enrollmentId: enrollee.enrollmentId,
        channel,
        pastorUserId: enrollee.pastorUserId ?? undefined,
      });
      if (result.error) {
        console.error("Could not log contact:", result.error);
      }
    });
  }

  const contactButton = `inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 ${pending ? "opacity-60" : ""}`;

  return (
    <div
      className={`grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-start ${
        selected ? "bg-sky-50/50" : ""
      }`}
    >
      <div className="grid gap-1 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={(event) => onSelectedChange(event.target.checked)}
              aria-label={`Select ${enrollee.name}`}
              className="size-4 accent-[var(--color-brand-blue)]"
            />
          ) : null}
          <Link
            href={`/admin/my-enrollees/${enrollee.enrollmentId}`}
            className="ppc-heading w-fit text-sm font-semibold text-zinc-900 hover:underline"
          >
            {enrollee.name}
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[0.65rem] font-semibold text-zinc-700">
            {statusMeta.emoji} {statusMeta.label}
          </span>
          <FullnessTag value={enrollee.fullness} />
          <CohortMoveTag state={moveState} />
        </div>
        <p className="text-zinc-500">
          {enrollee.email} · {enrollee.phone}
        </p>
        <p className="text-zinc-500">
          {enrollee.region ? `${enrollee.region}, ` : ""}
          {enrollee.country}
          {enrollee.birthYear ? ` · Born ${enrollee.birthYear}` : ""}
        </p>
        <p className="text-zinc-500">
          {enrollee.cohortTitle} · {enrollee.status.replaceAll("_", " ")}
          {enrollee.referralSource
            ? ` · Heard via ${enrollee.referralSource.replaceAll("_", " ")}`
            : ""}
          {showPastor ? ` · Pastor: ${enrollee.pastorName ?? "Unassigned"}` : ""}
        </p>
        <p className="text-zinc-500">
          Prep: {enrollee.preparationDaysComplete}/{enrollee.preparationDaysTotal} ·
          Morning prayer: {enrollee.morningPrayerDays}d · Reviews:{" "}
          {enrollee.reviewSessionsComplete}
        </p>
        <p className="text-zinc-500">
          Quizzes: {enrollee.quizzesPassed}/{enrollee.quizzesTotal} · Responses
          approved: {enrollee.responsesApproved} · Certificate:{" "}
          {enrollee.certificateIssued ? "Issued" : "Not yet"} · Referred:{" "}
          {enrollee.referredCount}
        </p>
        <p className="text-zinc-500">
          WhatsApp: {enrollee.whatsappConsent ? "Opted in" : "Not opted in"} ·{" "}
          {enrollee.contactCount > 0 && enrollee.lastContactedAt
            ? `Contacted ${enrollee.contactCount}x, last ${relativeTime(enrollee.lastContactedAt)}`
            : "Not yet contacted"}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {isAdmin ? (
          <FullnessSelect
            value={enrollee.fullness}
            disabled={fullnessPending}
            onChange={onSetFullness}
            label={`Fullness tag for ${enrollee.name}`}
          />
        ) : null}
        <Link
          href={`/admin/my-enrollees/${enrollee.enrollmentId}`}
          className={contactButton}
        >
          Review assignments
        </Link>
        <button
          type="button"
          onClick={() => setFollowUpOpen(true)}
          className={contactButton}
        >
          Follow up
        </button>
        <a
          href={`tel:${enrollee.phone}`}
          onClick={() => logContact("call")}
          className={contactButton}
        >
          Call
        </a>
        {moveTarget ? (
          <CohortMoveControls enrollee={enrollee} target={moveTarget} state={moveState} />
        ) : null}
      </div>

      <FollowUpMessageDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        enrollee={enrollee}
        pastorUserId={enrollee.pastorUserId}
      />
    </div>
  );
}

export function PastorFollowupView({
  enrollees,
  cohorts,
  isAdmin,
  pastorOptions,
  selectedPastorId,
  moveTarget,
  moveStates,
}: {
  enrollees: PastorEnrollee[];
  cohorts: PastorCohortWindow[];
  isAdmin: boolean;
  pastorOptions: Array<{ id: string; name: string }>;
  selectedPastorId: string | null;
  /** The cohort enrollees can be moved into right now, if one is getting ready. */
  moveTarget: CohortMoveTarget | null;
  moveStates: CohortMoveStates;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showAll = isAdmin && selectedPastorId === ALL_PASTORS;
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [fullnessFilter, setFullnessFilter] = useState<FullnessFilter>("all");
  const [cohortFilter, setCohortFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [moveFilter, setMoveFilter] = useState<CohortMoveFilter>("all");
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [fullnessPending, startFullnessTransition] = useTransition();
  const [fullnessError, setFullnessError] = useState<string | null>(null);
  const [movePending, startMoveTransition] = useTransition();
  const [moveNotice, setMoveNotice] = useState<{ isError: boolean; text: string } | null>(null);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);

  const canMove = (enrollee: PastorEnrollee) => canMoveTo(enrollee, moveTarget);

  // Tags show immediately; the server action's revalidation then replaces
  // `enrollees` with the saved values.
  const [shownEnrollees, applyFullness] = useOptimistic(
    enrollees,
    (state, update: { ids: Set<number>; value: FullnessMembership | null }) =>
      state.map((enrollee) =>
        update.ids.has(enrollee.enrollmentId) ? { ...enrollee, fullness: update.value } : enrollee,
      ),
  );

  function setFullness(ids: number[], value: FullnessMembership | null) {
    if (!ids.length) return;
    setFullnessError(null);
    startFullnessTransition(async () => {
      applyFullness({ ids: new Set(ids), value });
      const result = await setEnrolleeFullness({ enrollmentIds: ids, value });
      if (result.error) {
        setFullnessError(result.error);
        return;
      }
      setSelected(new Set());
      await queryClient.invalidateQueries({ queryKey: ["pastor", "sogp", "daily"] });
    });
  }

  const filtered = useMemo(
    () =>
      shownEnrollees.filter(
        (item) =>
          matchesFullnessFilter(item.fullness, fullnessFilter) &&
          (cohortFilter === "all" || item.cohortId === cohortFilter) &&
          matchesStatusFilter(item.followUpStatus, statusFilter) &&
          matchesCohortMoveFilter(
            moveStates[item.enrollmentId],
            canMoveTo(item, moveTarget),
            moveFilter,
          ),
      ),
    [shownEnrollees, fullnessFilter, cohortFilter, statusFilter, moveFilter, moveStates, moveTarget],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = query
      ? filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.email.toLowerCase().includes(query) ||
            item.phone.includes(query),
        )
      : filtered;
    return sortEnrollees(matched, sortKey);
  }, [filtered, search, sortKey]);

  const allVisibleSelected = visible.length > 0 && visible.every((item) => selected.has(item.enrollmentId));

  // Only people who can actually move count towards the bulk move actions.
  const selectedMovable = shownEnrollees
    .filter((item) => selected.has(item.enrollmentId) && canMove(item))
    .map((item) => item.enrollmentId);

  function markSelectedAsked() {
    const target = moveTarget;
    if (!target || !selectedMovable.length) return;
    setMoveNotice(null);
    startMoveTransition(async () => {
      const result = await setCohortMoveResponse({
        enrollmentIds: selectedMovable,
        targetCohortId: target.id,
        response: "asked",
      });
      if (result.error) {
        setMoveNotice({ isError: true, text: result.error });
        return;
      }
      setSelected(new Set());
    });
  }

  function moveSelected() {
    const target = moveTarget;
    if (!target || !selectedMovable.length) return;
    setMoveNotice(null);
    startMoveTransition(async () => {
      const result = await moveEnrolleesToCohort({
        enrollmentIds: selectedMovable,
        targetCohortId: target.id,
      });
      setBulkMoveOpen(false);
      if (result.error) {
        setMoveNotice({ isError: true, text: result.error });
        return;
      }
      const skipped = result.skipped
        .map((row) => `${row.name || `#${row.enrollmentId}`} (${row.reason})`)
        .join("; ");
      setMoveNotice({
        isError: result.skipped.length > 0,
        text: `Moved ${result.moved} to ${target.title}.${skipped ? ` Not moved: ${skipped}.` : ""}`,
      });
      setSelected(new Set());
      await queryClient.invalidateQueries({ queryKey: ["pastor", "sogp", "daily"] });
    });
  }

  function toggleSelected(enrollmentId: number, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(enrollmentId);
      else next.delete(enrollmentId);
      return next;
    });
  }

  const controlClass = "h-8 rounded-sm border border-zinc-200 bg-white px-2";

  return (
    <div className="grid gap-4">
      <PageHeader
        title={showAll ? "All enrollees" : "My Enrollees"}
        description={
          showAll
            ? "Every SOGP enrollee. Tag Fullness members to filter and sort."
            : "Everyone assigned to you for follow-up."
        }
      >
        {isAdmin && pastorOptions.length > 0 ? (
          <select
            value={selectedPastorId ?? ALL_PASTORS}
            onChange={(event) => {
              setSelected(new Set());
              router.push(`/admin/my-enrollees?pastorId=${event.target.value}`);
            }}
            aria-label="Show enrollees for"
            className="h-8 max-w-[45vw] truncate rounded-sm border border-zinc-200 px-2 text-xs sm:max-w-xs"
          >
            <option value={ALL_PASTORS}>All enrollees</option>
            {pastorOptions.map((pastor) => (
              <option key={pastor.id} value={pastor.id}>
                {pastor.name}
              </option>
            ))}
          </select>
        ) : null}
      </PageHeader>

      <ProgressSummary enrollees={filtered} totalLabel={showAll ? "Enrollees" : "Assigned"} />

      {selectedPastorId && cohorts.length > 0 ? (
        <PastorDailyParticipationSection
          cohorts={cohorts}
          pastorId={selectedPastorId}
          fullnessFilter={fullnessFilter}
        />
      ) : null}

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelected(new Set());
              }}
              placeholder="Search name, email, phone…"
              className="h-8 rounded-sm border border-zinc-200 px-2.5"
            />
            <label className="flex items-center gap-1.5">
              Fullness
              <select
                value={fullnessFilter}
                onChange={(event) => {
                  setFullnessFilter(event.target.value as FullnessFilter);
                  setSelected(new Set());
                }}
                className={controlClass}
              >
                {FULLNESS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {cohorts.length > 1 ? (
              <label className="flex items-center gap-1.5">
                Cohort
                <select
                  value={cohortFilter}
                  onChange={(event) => {
                    setCohortFilter(event.target.value === "all" ? "all" : Number(event.target.value));
                    setSelected(new Set());
                  }}
                  className={controlClass}
                >
                  <option value="all">All</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="flex items-center gap-1.5">
              Status
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setSelected(new Set());
                }}
                className={controlClass}
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {moveTarget ? (
              <label className="flex items-center gap-1.5">
                Cohort move
                <select
                  value={moveFilter}
                  onChange={(event) => {
                    setMoveFilter(event.target.value as CohortMoveFilter);
                    setSelected(new Set());
                  }}
                  className={controlClass}
                >
                  {COHORT_MOVE_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-zinc-500">
              {visible.length} enrollee{visible.length === 1 ? "" : "s"}
            </span>
            <label className="flex items-center gap-1.5">
              Sort by
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className={controlClass}
              >
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => downloadEnrolleesCsv(visible, moveStates)}
              disabled={visible.length === 0}
              className="h-8 rounded-sm border border-zinc-200 bg-white px-3 font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {isAdmin && visible.length > 0 ? (
          <label className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(event) =>
                setSelected(
                  event.target.checked ? new Set(visible.map((item) => item.enrollmentId)) : new Set(),
                )
              }
              className="size-4 accent-[var(--color-brand-blue)]"
            />
            Select all shown ({visible.length})
          </label>
        ) : null}

        {fullnessError ? (
          <p role="alert" className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">
            {fullnessError}
          </p>
        ) : null}

        {moveNotice ? (
          <p
            role={moveNotice.isError ? "alert" : "status"}
            className={`border-b px-4 py-2 text-xs ${
              moveNotice.isError
                ? "border-rose-100 bg-rose-50 text-rose-700"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            {moveNotice.text}
          </p>
        ) : null}

        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-zinc-500">
            {enrollees.length === 0
              ? showAll
                ? "No enrollees yet."
                : "No enrollees assigned yet."
              : "No enrollees match your search or filter."}
          </p>
        ) : (
          visible.map((enrollee) => (
            <EnrolleeRow
              key={enrollee.enrollmentId}
              enrollee={enrollee}
              isAdmin={isAdmin}
              showPastor={showAll}
              selected={selected.has(enrollee.enrollmentId)}
              onSelectedChange={(checked) => toggleSelected(enrollee.enrollmentId, checked)}
              onSetFullness={(value) => setFullness([enrollee.enrollmentId], value)}
              fullnessPending={fullnessPending}
              moveTarget={canMove(enrollee) ? moveTarget : null}
              moveState={moveStates[enrollee.enrollmentId]}
            />
          ))
        )}
      </section>

      {isAdmin && selected.size > 0 ? (
        <div
          role="region"
          aria-label="Bulk actions"
          className="sticky bottom-3 z-20 flex flex-wrap items-center gap-2 rounded-sm border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md"
        >
          <span className="font-medium text-zinc-900">{selected.size} selected</span>
          <button
            type="button"
            disabled={fullnessPending}
            onClick={() => setFullness([...selected], "fullness")}
            className="h-8 rounded-sm bg-[var(--color-brand-blue)] px-3 font-medium text-white disabled:opacity-60"
          >
            Mark as Fullness
          </button>
          <button
            type="button"
            disabled={fullnessPending}
            onClick={() => setFullness([...selected], "non_fullness")}
            className="h-8 rounded-sm border border-zinc-200 bg-white px-3 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            Mark as Non-Fullness
          </button>
          <button
            type="button"
            disabled={fullnessPending}
            onClick={() => setFullness([...selected], null)}
            className="h-8 rounded-sm border border-zinc-200 bg-white px-3 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            Clear tag
          </button>
          {moveTarget && selectedMovable.length > 0 ? (
            <>
              <button
                type="button"
                disabled={movePending}
                onClick={markSelectedAsked}
                className="h-8 rounded-sm border border-zinc-200 bg-white px-3 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                Mark {selectedMovable.length} as asked
              </button>
              <button
                type="button"
                disabled={movePending}
                onClick={() => setBulkMoveOpen(true)}
                className="h-8 rounded-sm border border-[var(--color-brand-blue)] bg-white px-3 font-medium text-[var(--color-brand-blue)] hover:bg-sky-50 disabled:opacity-60"
              >
                Move {selectedMovable.length} to {moveTarget.title}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto h-8 px-2 font-medium text-zinc-500 hover:text-zinc-800"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {moveTarget ? (
        <CohortMoveConfirmDialog
          open={bulkMoveOpen}
          onOpenChange={setBulkMoveOpen}
          who={`${selectedMovable.length} enrollee${selectedMovable.length === 1 ? "" : "s"}`}
          target={moveTarget}
          pending={movePending}
          onConfirm={moveSelected}
        />
      ) : null}
    </div>
  );
}
