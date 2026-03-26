type ReviewStatus = "all" | "pending_review" | "approved" | "needs_revision";
type QaStatus = "all" | "open" | "answered" | "closed";

type ReviewSubmission = {
  id: number;
  status: string;
  studentName: string;
  studentEmail: string;
  lessonTitle: string;
  lessonNumber: number;
  levelId: number;
  content: string;
};

type QaThread = {
  id: number;
  status: string;
  subject: string;
  studentName: string;
  studentEmail: string;
  lessonTitle: string;
  lessonNumber: number;
  levelId: number;
};

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function matchesLevel(levelId: number, filterValue: string) {
  if (filterValue === "all") {
    return true;
  }

  return levelId === Number.parseInt(filterValue, 10);
}

export function getReviewQueueCounts(submissions: Pick<ReviewSubmission, "status">[]) {
  return submissions.reduce<Record<ReviewStatus, number>>(
    (counts, submission) => ({
      ...counts,
      [submission.status as Exclude<ReviewStatus, "all">]:
        (counts[submission.status as Exclude<ReviewStatus, "all">] ?? 0) + 1,
      all: counts.all + 1,
    }),
    {
      all: 0,
      pending_review: 0,
      approved: 0,
      needs_revision: 0,
    },
  );
}

export function filterReviewQueue<T extends ReviewSubmission>(
  submissions: T[],
  filters: {
    activeTab: ReviewStatus;
    levelId: string;
    query: string;
  },
) {
  const query = normalizeQuery(filters.query);

  return submissions.filter((submission) => {
    if (
      filters.activeTab !== "all" &&
      submission.status !== filters.activeTab
    ) {
      return false;
    }

    if (!matchesLevel(submission.levelId, filters.levelId)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      submission.studentName,
      submission.studentEmail,
      submission.lessonTitle,
      `l${submission.lessonNumber}`,
      submission.content,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function getQaInboxCounts(threads: Pick<QaThread, "status">[]) {
  return threads.reduce<Record<QaStatus, number>>(
    (counts, thread) => ({
      ...counts,
      [thread.status as Exclude<QaStatus, "all">]:
        (counts[thread.status as Exclude<QaStatus, "all">] ?? 0) + 1,
      all: counts.all + 1,
    }),
    {
      all: 0,
      open: 0,
      answered: 0,
      closed: 0,
    },
  );
}

export function filterQaInbox<T extends QaThread>(
  threads: T[],
  filters: {
    activeTab: QaStatus;
    levelId: string;
    query: string;
  },
) {
  const query = normalizeQuery(filters.query);

  return threads.filter((thread) => {
    if (filters.activeTab !== "all" && thread.status !== filters.activeTab) {
      return false;
    }

    if (!matchesLevel(thread.levelId, filters.levelId)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      thread.subject,
      thread.studentName,
      thread.studentEmail,
      thread.lessonTitle,
      `l${thread.lessonNumber}`,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function resolveNextSelectedThreadId<T extends Pick<QaThread, "id">>(
  threads: T[],
  selectedId: number | null,
) {
  if (selectedId != null && threads.some((thread) => thread.id === selectedId)) {
    return selectedId;
  }

  return threads[0]?.id ?? null;
}
