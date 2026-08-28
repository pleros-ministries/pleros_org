export const ADMIN_QUERY_KEYS = {
  dashboard: ["admin", "dashboard"] as const,
  schoolOfPurposeWaitlist: ["admin", "school-of-purpose", "waitlist"] as const,
  sogp: ["admin", "sogp"] as const,
  registrants: ["admin", "registrants"] as const,
  platform: ["admin", "platform"] as const,
  staff: ["admin", "staff"] as const,
  qa: ["admin", "qa"] as const,
  review: ["admin", "review"] as const,
};

export type AdminSogpData = {
  cohorts: Array<{
    id: number;
    slug: string;
    title: string;
    status: string;
    startsAt: string;
    endsAt: string;
    telegramChannelUrl: string | null;
    telegramDiscussionUrl: string | null;
    telegramBotUsername: string | null;
  }>;
  enrollments: Array<{
    id: number;
    cohortId: number;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    phone: string;
    countryCode: string;
    country: string;
    region: string;
    birthYear: number | null;
    referralSource: string;
    whatsappConsent: boolean;
    whatsappOptedInAt: string | null;
    status: string;
    telegramLinkedAt: string | null;
    createdAt: string;
    morningPrayerDays: number;
    preparationDaysComplete: number;
    reviewSessionsComplete: number;
  }>;
  tracks: Array<{
    id: number;
    cohortId: number;
    dayNumber: number | null;
    weekNumber: number;
    curriculumLevel: number;
    curriculumOrder: number;
    isRequired: boolean;
    liveSessionNumber: number | null;
    lessonId: number;
    levelId: number;
    lessonNumber: number;
    title: string;
    status: string;
    ready: boolean;
  }>;
  levelThreeLessons: Array<{
    id: number;
    lessonNumber: number;
    title: string;
    status: string;
    ready: boolean;
  }>;
  liveClasses: Array<{
    id: number;
    cohortId: number;
    title: string;
    startsAt: string;
    endsAt: string;
    status: string;
    youtubeLiveUrl: string | null;
    recordingUrl: string | null;
    isRequired: boolean;
  }>;
  certificates: Array<{
    id: number;
    enrollmentId: number;
    verificationCode: string;
    issuedAt: string;
    revokedAt: string | null;
  }>;
  preparationDays: Array<{
    id: number;
    cohortId: number;
    publishDate: string;
    countdownLabel: string;
    introduction: string;
    status: "draft" | "published";
    resources: Array<{
      id: number;
      type: "teaching" | "podcast" | "video" | "reading" | "gift" | "announcement";
      title: string;
      description: string | null;
      url: string;
      sortOrder: number;
    }>;
  }>;
  telegram: {
    channelConfigured: boolean;
    botConfigured: boolean;
    webhookSecretConfigured: boolean;
  };
};

export const ADMIN_QUERY_DEFAULTS = {
  staleTime: 30_000,
  gcTime: 10 * 60_000,
};

export type AdminDashboardData = {
  canManageContent: boolean;
  currentStaffId: string;
  overviewCards: Array<{
    label: string;
    value: string | number;
    hint: string;
  }>;
  stats: {
    activeStudents: number;
    averageProgress: number;
    pendingReviews: number;
    openQa: number;
  };
  counts: {
    registrants: number;
    welcomeOnly: number;
    users: number;
    publishedLessons: number;
  };
  reviewOwnership: {
    mine: number;
    unassigned: number;
    mineHint: string;
    unassignedHint: string;
  };
  qaOwnership: {
    mine: number;
    unassigned: number;
    mineHint: string;
    unassignedHint: string;
  };
  reviewPressure: {
    hint: string;
  };
  qaPressure: {
    hint: string;
  };
  contentDebt: {
    readyDraftLessons: number;
    incompleteDraftLessons: number;
    publishedWithGaps: number;
    totalDebt: number;
    topItems: Array<{
      id: number;
      title: string;
      detail: string;
      tone: "warning" | "default";
    }>;
  };
  staffAccessSummary: {
    totalStaff: number;
    admins: number;
    instructors: number;
    pendingInvites: number;
    expiredInvites: number;
    acceptedInvites: number;
    hint: string;
  } | null;
  reviewQueuePreview: Array<{
    id: number;
    userId: string;
    studentName: string;
    levelId: number;
    lessonNumber: number;
    lessonTitle: string;
    status: string;
    assignedToId: string | null;
    submittedAt: string | null;
  }>;
  qaPreview: Array<{
    id: number;
    subject: string;
    studentName: string;
    levelId: number;
    lessonNumber: number;
    assignedToId: string | null;
    createdAt: string | null;
  }>;
};

export type AdminSchoolOfPurposeWaitlistEntry = {
  id: number;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
};

export type AdminPlatformData = {
  students: Array<{
    id: string;
    name: string;
    email: string;
    currentLevel: number;
  }>;
  reviewerAssignments: Array<{
    id: number;
    userId: string;
    levelId: number;
    userName: string;
    userEmail: string;
  }>;
  instructors: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  stats: {
    totalUsers: number;
    publishedLessons: number;
    totalGraduations: number;
  };
  adminId: string;
};

export type AdminStaffData = {
  staffUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  invites: Array<{
    id: number;
    email: string;
    role: string;
    invitedByName: string | null;
    status: "pending" | "accepted" | "revoked" | "expired";
    expiresAt: string;
    createdAt: string;
  }>;
};
