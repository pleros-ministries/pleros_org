type ContentOverviewItem = {
  id: number;
  title: string;
  draftCount: number;
  publishedCount: number;
  totalLessons: number;
};

export function formatDashboardAge(
  value: string | Date | null,
  nowIso = new Date().toISOString(),
) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  const now = new Date(nowIso);

  if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) {
    return null;
  }

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) {
    return "Today";
  }

  return `${diffDays}d ago`;
}

export function getQueuePressureSummary<
  T,
  K extends keyof T,
>(
  items: T[],
  dateKey: K,
  nowIso = new Date().toISOString(),
) {
  if (items.length === 0) {
    return {
      total: 0,
      oldestAgeLabel: null,
      hint: "Nothing waiting right now",
    };
  }

  const oldestValue = items
    .map((item) => item[dateKey])
    .reduce<Array<string | Date>>((dates, value) => {
      if (typeof value === "string" || value instanceof Date) {
        dates.push(value);
      }

      return dates;
    }, [])
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0] ?? null;

  const oldestAgeLabel = formatDashboardAge(oldestValue, nowIso);

  return {
    total: items.length,
    oldestAgeLabel,
    hint: oldestAgeLabel
      ? `Oldest item is ${oldestAgeLabel}`
      : "Work is waiting",
  };
}

export function getAssignmentOwnershipSummary<
  T extends { assignedToId: string | null },
  K extends keyof T,
>(
  items: T[],
  currentStaffId: string,
  dateKey: K,
  nowIso = new Date().toISOString(),
) {
  const mine = items.filter((item) => item.assignedToId === currentStaffId);
  const unassigned = items.filter((item) => item.assignedToId == null);

  const minePressure = getQueuePressureSummary(mine, dateKey, nowIso);
  const unassignedPressure = getQueuePressureSummary(unassigned, dateKey, nowIso);

  return {
    mine: mine.length,
    unassigned: unassigned.length,
    oldestMineAgeLabel: minePressure.oldestAgeLabel,
    oldestUnassignedAgeLabel: unassignedPressure.oldestAgeLabel,
    mineHint:
      mine.length > 0
        ? `Oldest assigned item is ${minePressure.oldestAgeLabel ?? "waiting"}`
        : "Nothing assigned to you",
    unassignedHint:
      unassigned.length > 0
        ? `Oldest unassigned item is ${unassignedPressure.oldestAgeLabel ?? "waiting"}`
        : "No unassigned work",
  };
}

export function prioritizeOwnershipRows<
  T extends { assignedToId: string | null },
>(items: T[], currentStaffId: string) {
  return [...items].sort((left, right) => {
    const rank = (assignedToId: string | null) => {
      if (assignedToId === currentStaffId) {
        return 0;
      }

      if (assignedToId == null) {
        return 1;
      }

      return 2;
    };

    return rank(left.assignedToId) - rank(right.assignedToId);
  });
}

export function getContentWatchlistSummary(levels: ContentOverviewItem[]) {
  const watchItems = levels
    .filter((level) => level.draftCount > 0)
    .map((level) => ({
      id: level.id,
      title: level.title,
      detail:
        level.publishedCount === 0
          ? `${level.draftCount} draft${level.draftCount === 1 ? "" : "s"} · nothing published yet`
          : `${level.draftCount} draft${level.draftCount === 1 ? "" : "s"} · ${level.publishedCount} published`,
      tone: (level.publishedCount === 0 ? "warning" : "default") as
        | "warning"
        | "default",
    }));

  return {
    draftLessons: levels.reduce((total, level) => total + level.draftCount, 0),
    levelsWithDrafts: watchItems.length,
    emptyPublishedLevels: levels.filter(
      (level) => level.totalLessons > 0 && level.publishedCount === 0,
    ).length,
    watchItems,
  };
}
