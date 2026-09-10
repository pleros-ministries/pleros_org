import Link from "next/link";

import type { UnitRailCard } from "@/lib/db/queries/community-units";

import { CommunityNav } from "./community-nav";
import { PrayerWatchRail } from "./prayer-watch-rail";

const card =
  "rounded-2xl border border-(--color-line-strong) bg-white p-5 shadow-(--shadow-sm)";

function cohortLine(cohort: UnitRailCard["cohort"]) {
  if (!cohort) return null;
  if (cohort.phase === "active" && cohort.week != null) {
    return `Week ${cohort.week} of ${cohort.total}`;
  }
  if (cohort.phase === "preparation") return "Preparation";
  return "Programme complete";
}

/** The rail's inner stack — reused by the desktop rail and the mobile sheet. */
export function CommunityRailContent({
  unitCard,
  unitId,
  showLeaderTab = false,
  onNavigate,
}: {
  unitCard: UnitRailCard | null;
  unitId: number | null;
  showLeaderTab?: boolean;
  onNavigate?: () => void;
}) {
  const cohort = cohortLine(unitCard?.cohort ?? null);

  return (
    <div className="grid gap-4">
      {unitCard ? (
        <Link
          href={`/dashboard/community/unit/${unitCard.id}`}
          onClick={onNavigate}
          className={`${card} block transition-colors hover:border-zinc-300`}
        >
          <p className="text-xs font-medium text-zinc-500">Your unit</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
            {unitCard.flag ? (
              <span aria-hidden className="text-base leading-none">
                {unitCard.flag}
              </span>
            ) : null}
            {unitCard.name}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {unitCard.memberCount} member
            {unitCard.memberCount === 1 ? "" : "s"}
            {unitCard.leaderFirstName
              ? ` · led by ${unitCard.leaderFirstName}`
              : " · no leader yet"}
          </p>
          {cohort ? (
            <p className="mt-2 inline-flex items-center rounded-full bg-(--muted) px-2 py-0.5 text-[0.7rem] font-medium text-(--color-brand-blue)">
              {cohort}
            </p>
          ) : null}
        </Link>
      ) : null}

      <CommunityNav
        unitId={unitId}
        showLeaderTab={showLeaderTab}
        onNavigate={onNavigate}
      />

      <PrayerWatchRail />
    </div>
  );
}

export function CommunityLeftRail({
  unitCard,
  unitId,
  showLeaderTab = false,
  className = "",
}: {
  unitCard: UnitRailCard | null;
  unitId: number | null;
  showLeaderTab?: boolean;
  className?: string;
}) {
  return (
    <aside className={className}>
      <div className="sticky top-16">
        <CommunityRailContent
          unitCard={unitCard}
          unitId={unitId}
          showLeaderTab={showLeaderTab}
        />
      </div>
    </aside>
  );
}
