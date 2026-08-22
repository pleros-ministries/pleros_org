type ReviewStatus = "all" | "pending_review" | "approved" | "needs_revision";
type QaStatus = "all" | "open" | "answered" | "closed";
export type AssignmentScope = "all" | "mine" | "unassigned";

type ReviewSubmission = {
  id: number;
  status: string;
  assignedToId: string | null;
  studentName: string;
  studentEmail: string;
  lessonTitle: string;
  lessonNumber: number;
  levelId: number;
  content: string;
};

type ReviewGradingInput = {
  status: string;
  content: string;
  responsePrompt: string | null;
  responseMarkingGuide: string | null;
};

type ReviewGradingRequirement = "prompt" | "marking_guide" | "response";

type QaThread = {
  id: number;
  status: string;
  assignedToId: string | null;
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

function hasText(value: string | null) {
  return Boolean(value?.trim());
}

function formatMissingRequirements(missing: ReviewGradingRequirement[]) {
  const labels: Record<ReviewGradingRequirement, string> = {
    prompt: "prompt",
    marking_guide: "marking guide",
    response: "response",
  };
  const readable = missing.map((item) => labels[item]);

  if (readable.length === 1) {
    return readable[0];
  }

  if (readable.length === 2) {
    return `${readable[0]} and ${readable[1]}`;
  }

  return `${readable.slice(0, -1).join(", ")}, and ${readable.at(-1)}`;
}

function matchesLevel(levelId: number, filterValue: string) {
  if (filterValue === "all") {
    return true;
  }

  return levelId === Number.parseInt(filterValue, 10);
}

function matchesAssignment(
  assignedToId: string | null,
  assignmentScope: AssignmentScope,
  currentStaffId: string,
) {
  if (assignmentScope === "all") {
    return true;
  }

  if (assignmentScope === "mine") {
    return assignedToId === currentStaffId;
  }

  return assignedToId == null;
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

export function getReviewGradingReadiness(input: ReviewGradingInput) {
  const isPendingReview =
    input.status === "pending_review" || input.status === "submitted";

  if (!isPendingReview) {
    return {
      canGrade: false,
      missing: [] as ReviewGradingRequirement[],
      label: "Review completed",
      detail: "This submission is no longer waiting for a grading action.",
    };
  }

  const missing: ReviewGradingRequirement[] = [];

  if (!hasText(input.responsePrompt)) {
    missing.push("prompt");
  }

  if (!hasText(input.responseMarkingGuide)) {
    missing.push("marking_guide");
  }

  if (!hasText(input.content)) {
    missing.push("response");
  }

  if (missing.length === 0) {
    return {
      canGrade: true,
      missing,
      label: "Ready to grade",
      detail: "Prompt, marking guide, and student response are present.",
    };
  }

  return {
    canGrade: false,
    missing,
    label: "Needs setup before grading",
    detail: `Missing ${formatMissingRequirements(missing)}.`,
  };
}

export function filterReviewQueue<T extends ReviewSubmission>(
  submissions: T[],
  filters: {
    activeTab: ReviewStatus;
    assignmentScope: AssignmentScope;
    currentStaffId: string;
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

    if (
      !matchesAssignment(
        submission.assignedToId,
        filters.assignmentScope,
        filters.currentStaffId,
      )
    ) {
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
    assignmentScope: AssignmentScope;
    currentStaffId: string;
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

    if (
      !matchesAssignment(
        thread.assignedToId,
        filters.assignmentScope,
        filters.currentStaffId,
      )
    ) {
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

export function resolveNextSelectedSubmissionId<
  T extends Pick<ReviewSubmission, "id">,
>(submissions: T[], selectedId: number | null) {
  if (
    selectedId != null &&
    submissions.some((submission) => submission.id === selectedId)
  ) {
    return selectedId;
  }

  return submissions[0]?.id ?? null;
}
