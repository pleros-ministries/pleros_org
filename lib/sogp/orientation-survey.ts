export const SOGP_ORIENTATION_REASONS = [
  {
    value: "faith_answers",
    label: "Seeking answers about God and the Christian faith",
  },
  {
    value: "gods_purpose",
    label: "Discovering God's purpose for my life",
  },
  {
    value: "spiritual_growth_freedom",
    label: "Spiritual growth and freedom from addictions",
  },
  {
    value: "divine_healing",
    label: "Receiving and ministering divine healing",
  },
  {
    value: "ministry_supernatural_empowerment",
    label: "Empowerment for ministry and the supernatural",
  },
  {
    value: "wisdom_career_business_finance",
    label: "God's wisdom for career, business, and finances",
  },
  {
    value: "stronger_walk_fulfilling_purpose",
    label: "A stronger walk with God and fulfilling His purpose",
  },
] as const;

export type SogpOrientationReason = (typeof SOGP_ORIENTATION_REASONS)[number]["value"];

const VALID_REASONS = new Set<string>(
  SOGP_ORIENTATION_REASONS.map((reason) => reason.value),
);

const REQUIRED_REASON_COUNT = 3;
const MAX_QUESTION_LENGTH = 2000;

export function orientationReasonLabel(value: string) {
  return (
    SOGP_ORIENTATION_REASONS.find((reason) => reason.value === value)?.label ??
    value
  );
}

export type OrientationSurveyErrors = Partial<{
  reasons: string;
  question: string;
}>;

export function validateOrientationSurvey(input: {
  reasons: string[];
  question?: string | null;
}): { errors: OrientationSurveyErrors; question: string | null } {
  const errors: OrientationSurveyErrors = {};

  const uniqueReasons = Array.from(new Set(input.reasons));
  if (
    uniqueReasons.length !== REQUIRED_REASON_COUNT ||
    uniqueReasons.some((reason) => !VALID_REASONS.has(reason))
  ) {
    errors.reasons = `Choose exactly ${REQUIRED_REASON_COUNT} reasons.`;
  }

  const trimmedQuestion = input.question?.trim() || "";
  if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
    errors.question = `Keep your question under ${MAX_QUESTION_LENGTH} characters.`;
  }

  return { errors, question: trimmedQuestion || null };
}
