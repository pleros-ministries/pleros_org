export type SogpCohortStatus =
  | "draft"
  | "enrollment_open"
  | "preparing"
  | "active"
  | "completed"
  | "archived";

export type SogpEnrollmentStatus =
  | "enrolled"
  | "preparing"
  | "active"
  | "carryover"
  | "completed"
  | "withdrawn";

export type SogpLearnerState =
  | "preparing"
  | "active"
  | "carryover"
  | "completed"
  | "withdrawn";

export type SogpAssessmentPolicy = {
  requiredTrackCompletionPercent: number;
  requiredPrayerWatchPercent: number;
  requiredPodcastDailyPercent: number;
  requiredLiveClassCount: number;
};

export const DEFAULT_SOGP_ASSESSMENT_POLICY: SogpAssessmentPolicy = {
  requiredTrackCompletionPercent: 100,
  requiredPrayerWatchPercent: 80,
  requiredPodcastDailyPercent: 100,
  requiredLiveClassCount: 0,
};

export type SogpEligibilityInput = {
  completedTracks: number;
  totalTracks: number;
  prayerDaysAttended: number;
  prayerDaysAvailable: number;
  podcastDaysLogged: number;
  podcastDaysAvailable: number;
  liveClassesAttended: number;
  policy: SogpAssessmentPolicy;
};

export type SogpEligibilityResult = {
  eligible: boolean;
  trackPercent: number;
  prayerPercent: number;
  podcastPercent: number;
  unmet: Array<"tracks" | "prayer_watch" | "podcast" | "live_classes">;
};

export type SogpEnrollmentCreateInput = {
  cohortId: number;
  userId: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  reason?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

export type SogpDashboardTrack = {
  id: number;
  dayNumber: number;
  weekNumber: number;
  releaseAt: Date;
  lesson: {
    id: number;
    levelId: number;
    lessonNumber: number;
    title: string;
    audioUrl: string | null;
    notesContent: string | null;
    responsePrompt: string | null;
    status: "draft" | "published";
  };
  progress: {
    audioListened: boolean;
    notesRead: boolean;
    quizPassed: boolean;
    writtenApproved: boolean;
  };
  completed: boolean;
};

export type SogpDashboardData = {
  enrollment: {
    id: number;
    userId: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    status: SogpEnrollmentStatus;
    telegramLinkedAt: Date | null;
  };
  cohort: {
    id: number;
    slug: string;
    title: string;
    status: SogpCohortStatus;
    startsAt: Date;
    endsAt: Date;
    preparationStartsAt: Date | null;
    telegramChannelUrl: string | null;
    telegramDiscussionUrl: string | null;
    telegramBotUsername: string | null;
    assessmentPolicy: SogpAssessmentPolicy;
  };
  learnerState: SogpLearnerState;
  tracks: SogpDashboardTrack[];
  liveClasses: Array<{
    id: number;
    title: string;
    startsAt: Date;
    endsAt: Date;
    youtubeLiveUrl: string | null;
    recordingUrl: string | null;
    status: "scheduled" | "live" | "completed" | "cancelled";
  }>;
  prayerDaysAttended: number;
  podcastDaysLogged: number;
  liveClassesAttended: number;
  certificate: { verificationCode: string; issuedAt: Date; revokedAt: Date | null } | null;
  rewards: Array<{ rewardKey: string; label: string; grantedAt: Date }>;
};
