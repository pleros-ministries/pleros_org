export const ADMIN_QUERY_KEYS = {
  schoolOfPurposeWaitlist: ["admin", "school-of-purpose", "waitlist"] as const,
  registrants: ["admin", "registrants"] as const,
  platform: ["admin", "platform"] as const,
  staff: ["admin", "staff"] as const,
  qa: ["admin", "qa"] as const,
  review: ["admin", "review"] as const,
};

export const ADMIN_QUERY_DEFAULTS = {
  staleTime: 30_000,
  gcTime: 10 * 60_000,
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
