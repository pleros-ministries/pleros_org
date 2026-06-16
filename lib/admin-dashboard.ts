import { getLessonPublishReadiness } from "./ppc-content-cms";

type ContentOverviewItem = {
  id: number;
  title: string;
  draftCount: number;
  publishedCount: number;
  totalLessons: number;
};

type ContentDebtLesson = {
  id: number;
  lessonNumber: number;
  title: string;
  status: string;
  audioUrl: string | null;
  notesContent: string | null;
  responsePrompt: string | null;
  responseMarkingGuide: string | null;
  questions: Array<{
    questionType: string;
    questionText: string;
    options: string[] | null;
    correctAnswer: string | null;
  }>;
};

type ContentDebtLevel = {
  id: number;
  title: string;
  lessons: ContentDebtLesson[];
};

type StaffAccessUser = {
  role: string;
};

type StaffAccessInvite = {
  status: string;
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
          : `${level.draftCount} locked draft${level.draftCount === 1 ? "" : "s"} · ${level.publishedCount} released`,
      tone: (level.publishedCount === 0 ? "warning" : "default") as
        | "warning"
        | "default",
    }));

  return {
    draftLessons: levels.reduce((total, level) => total + level.draftCount, 0),
    levelsWithDrafts: watchItems.length,
    releaseRiskLevels: watchItems.length,
    emptyPublishedLevels: levels.filter(
      (level) => level.totalLessons > 0 && level.publishedCount === 0,
    ).length,
    watchItems,
  };
}

function formatContentDebtDetail(input: {
  readyDrafts: number;
  incompleteDrafts: number;
  publishedWithGaps: number;
}) {
  return [
    input.incompleteDrafts > 0
      ? `${input.incompleteDrafts} incomplete draft${input.incompleteDrafts === 1 ? "" : "s"}`
      : null,
    input.publishedWithGaps > 0
      ? `${input.publishedWithGaps} published with gaps`
      : null,
    input.readyDrafts > 0
      ? `${input.readyDrafts} ready draft${input.readyDrafts === 1 ? "" : "s"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function getContentDebtSummary(levels: ContentDebtLevel[]) {
  const levelItems = levels
    .map((level) => {
      const counts = level.lessons.reduce(
        (summary, lesson) => {
          const readiness = getLessonPublishReadiness({
            title: lesson.title,
            audioUrl: lesson.audioUrl,
            notesContent: lesson.notesContent,
            responsePrompt: lesson.responsePrompt,
            responseMarkingGuide: lesson.responseMarkingGuide,
            questions: lesson.questions,
          });

          if (lesson.status === "published") {
            if (!readiness.isReady) {
              summary.publishedWithGaps += 1;
            }
            return summary;
          }

          if (readiness.isReady) {
            summary.readyDrafts += 1;
          } else {
            summary.incompleteDrafts += 1;
          }

          return summary;
        },
        {
          readyDrafts: 0,
          incompleteDrafts: 0,
          publishedWithGaps: 0,
        },
      );

      return {
        id: level.id,
        title: level.title,
        ...counts,
        detail: formatContentDebtDetail(counts),
        tone:
          counts.incompleteDrafts > 0 || counts.publishedWithGaps > 0
            ? "warning"
            : "default",
      };
    })
    .filter((level) => level.detail.length > 0)
    .sort((left, right) => {
      const leftDebt = left.incompleteDrafts + left.publishedWithGaps;
      const rightDebt = right.incompleteDrafts + right.publishedWithGaps;

      if (rightDebt !== leftDebt) {
        return rightDebt - leftDebt;
      }

      return right.readyDrafts - left.readyDrafts;
    });

  const readyDraftLessons = levelItems.reduce(
    (total, level) => total + level.readyDrafts,
    0,
  );
  const incompleteDraftLessons = levelItems.reduce(
    (total, level) => total + level.incompleteDrafts,
    0,
  );
  const publishedWithGaps = levelItems.reduce(
    (total, level) => total + level.publishedWithGaps,
    0,
  );

  return {
    readyDraftLessons,
    incompleteDraftLessons,
    publishedWithGaps,
    totalDebt: incompleteDraftLessons + publishedWithGaps,
    topItems: levelItems.slice(0, 4).map((level) => ({
      id: level.id,
      title: level.title,
      detail: level.detail,
      tone: level.tone as "warning" | "default",
    })),
  };
}

export function getStaffAccessSummary(
  users: StaffAccessUser[],
  invites: StaffAccessInvite[],
) {
  const superAdmins = users.filter((user) => user.role === "super_admin").length;
  const admins = users.filter((user) => user.role === "admin").length;
  const instructors = users.filter((user) => user.role === "instructor").length;
  const pendingInvites = invites.filter((invite) => invite.status === "pending").length;
  const expiredInvites = invites.filter((invite) => invite.status === "expired").length;
  const acceptedInvites = invites.filter((invite) => invite.status === "accepted").length;
  const revokedInvites = invites.filter((invite) => invite.status === "revoked").length;
  const hintParts = [
    `${pendingInvites} pending invite${pendingInvites === 1 ? "" : "s"}`,
    expiredInvites > 0
      ? `${expiredInvites} expired`
      : `${acceptedInvites} accepted`,
  ];

  return {
    totalStaff: superAdmins + admins + instructors,
    superAdmins,
    admins,
    instructors,
    pendingInvites,
    expiredInvites,
    acceptedInvites,
    revokedInvites,
    hint: hintParts.join(" · "),
  };
}
