"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { recordFollowUpContact } from "@/app/admin/(app)/(pastor-only)/_actions/pastor-followup-actions";
import { PageHeader } from "@/components/ppc/page-header";
import type { PastorEnrollee } from "@/lib/db/queries/pastor-followups";

type SortKey = "recent" | "name" | "least-contacted" | "lowest-progress";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Recently assigned",
  name: "Name (A–Z)",
  "least-contacted": "Least contacted",
  "lowest-progress": "Needs most attention (lowest progress)",
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

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

function progressScore(enrollee: PastorEnrollee): number {
  return (
    enrollee.preparationDaysComplete / enrollee.preparationDaysTotal +
    (enrollee.morningPrayerDays > 0 ? 1 : 0) +
    (enrollee.reviewSessionsComplete > 0 ? 1 : 0)
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

function ProgressSummary({ enrollees }: { enrollees: PastorEnrollee[] }) {
  const summary = useMemo(() => {
    const buckets = { none: 0, some: 0, done: 0 };
    let morningPrayerActive = 0;
    for (const enrollee of enrollees) {
      if (enrollee.preparationDaysComplete === 0) buckets.none += 1;
      else if (enrollee.preparationDaysComplete >= enrollee.preparationDaysTotal)
        buckets.done += 1;
      else buckets.some += 1;
      if (enrollee.morningPrayerDays > 0) morningPrayerActive += 1;
    }
    return { buckets, morningPrayerActive };
  }, [enrollees]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="Assigned" value={enrollees.length} />
      <Stat label="Prep complete" value={summary.buckets.done} />
      <Stat label="Prep started" value={summary.buckets.some} />
      <Stat label="Morning prayer active" value={summary.morningPrayerActive} />
    </div>
  );
}

function EnrolleeRow({
  enrollee,
  pastorUserId,
}: {
  enrollee: PastorEnrollee;
  pastorUserId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function logContact(channel: "whatsapp" | "call" | "email") {
    startTransition(async () => {
      const result = await recordFollowUpContact({
        enrollmentId: enrollee.enrollmentId,
        channel,
        pastorUserId: pastorUserId ?? undefined,
      });
      if (result.error) {
        console.error("Could not log contact:", result.error);
      }
    });
  }

  const contactButton = `inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 ${pending ? "opacity-60" : ""}`;

  return (
    <div className="grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="grid gap-1 text-xs">
        <p className="ppc-heading text-sm font-semibold text-zinc-900">
          {enrollee.name}
        </p>
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
        </p>
        <p className="text-zinc-500">
          Prep: {enrollee.preparationDaysComplete}/{enrollee.preparationDaysTotal} ·
          Morning prayer: {enrollee.morningPrayerDays}d · Reviews:{" "}
          {enrollee.reviewSessionsComplete}
        </p>
        <p className="text-zinc-500">
          WhatsApp: {enrollee.whatsappConsent ? "Opted in" : "Not opted in"} ·{" "}
          {enrollee.contactCount > 0
            ? `Contacted ${enrollee.contactCount}x, last ${relativeTime(enrollee.lastContactedAt!)}`
            : "Not yet contacted"}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {enrollee.whatsappConsent ? (
          <a
            href={`https://wa.me/${digitsOnly(enrollee.phone)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => logContact("whatsapp")}
            className={contactButton}
          >
            WhatsApp
          </a>
        ) : null}
        <a
          href={`tel:${enrollee.phone}`}
          onClick={() => logContact("call")}
          className={contactButton}
        >
          Call
        </a>
        <a
          href={`mailto:${enrollee.email}`}
          onClick={() => logContact("email")}
          className={contactButton}
        >
          Email
        </a>
      </div>
    </div>
  );
}

export function PastorFollowupView({
  enrollees,
  isAdmin,
  pastorOptions,
  selectedPastorId,
}: {
  enrollees: PastorEnrollee[];
  isAdmin: boolean;
  pastorOptions: Array<{ id: string; name: string }>;
  selectedPastorId: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = query
      ? enrollees.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.email.toLowerCase().includes(query) ||
            item.phone.includes(query),
        )
      : enrollees;
    return sortEnrollees(matched, sortKey);
  }, [enrollees, search, sortKey]);

  return (
    <div className="grid gap-4">
      <PageHeader
        title="My Enrollees"
        description="Everyone assigned to you for follow-up."
      >
        {isAdmin && pastorOptions.length > 0 ? (
          <select
            value={selectedPastorId ?? ""}
            onChange={(event) =>
              router.push(`/admin/my-enrollees?pastorId=${event.target.value}`)
            }
            className="h-8 rounded-sm border border-zinc-200 px-2 text-xs"
          >
            {pastorOptions.map((pastor) => (
              <option key={pastor.id} value={pastor.id}>
                {pastor.name}
              </option>
            ))}
          </select>
        ) : null}
      </PageHeader>

      <ProgressSummary enrollees={enrollees} />

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 text-xs">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone…"
            className="h-8 rounded-sm border border-zinc-200 px-2.5"
          />
          <label className="flex items-center gap-1.5">
            Sort by
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="h-8 rounded-sm border border-zinc-200 px-2"
            >
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-zinc-500">
            {enrollees.length === 0
              ? "No enrollees assigned yet."
              : "No enrollees match your search."}
          </p>
        ) : (
          visible.map((enrollee) => (
            <EnrolleeRow
              key={enrollee.enrollmentId}
              enrollee={enrollee}
              pastorUserId={isAdmin ? selectedPastorId : null}
            />
          ))
        )}
      </section>
    </div>
  );
}
