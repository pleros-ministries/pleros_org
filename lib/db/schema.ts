import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
  uniqueIndex,
  index,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "instructor",
  "student",
]);

export const lessonStatusEnum = pgEnum("lesson_status", [
  "draft",
  "published",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "short_text",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "draft",
  "submitted",
  "approved",
  "needs_revision",
]);

export const qaStatusEnum = pgEnum("qa_status", [
  "open",
  "answered",
  "closed",
]);

export const qaAuthorRoleEnum = pgEnum("qa_author_role", [
  "student",
  "instructor",
  "admin",
  "super_admin",
]);

export const contactSubmissionStatusEnum = pgEnum("contact_submission_status", [
  "new",
  "read",
  "resolved",
]);

// ─── Welcome pack leads ─────────────────────────────────────────────────────

export const welcomePackLeads = pgTable(
  "welcome_pack_leads",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    source: text("source").notNull().default("welcome"),
    mainAccessGranted: boolean("main_access_granted").notNull().default(true),
    extraGiftsUnlocked: boolean("extra_gifts_unlocked").notNull().default(false),
    sharedConfirmedAt: timestamp("shared_confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("welcome_pack_leads_email_idx").on(t.email),
    index("welcome_pack_leads_created_at_idx").on(t.createdAt),
    index("welcome_pack_leads_extra_gifts_idx").on(t.extraGiftsUnlocked),
  ],
);

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull().default("student"),
    emailVerified: boolean("email_verified").notNull().default(false),
    startingLevel: integer("starting_level").notNull().default(1),
    location: text("location"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

// ─── Staff invites ──────────────────────────────────────────────────────────

export const staffInvites = pgTable(
  "staff_invites",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull(),
    tokenHash: text("token_hash").notNull(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => users.id),
    acceptedBy: text("accepted_by").references(() => users.id),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("staff_invites_email_idx").on(t.email),
    uniqueIndex("staff_invites_token_hash_idx").on(t.tokenHash),
    index("staff_invites_invited_by_idx").on(t.invitedBy),
  ],
);

// ─── Levels ─────────────────────────────────────────────────────────────────

export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  lessonCount: integer("lesson_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull(),
});

// ─── Lessons ────────────────────────────────────────────────────────────────

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    levelId: integer("level_id")
      .notNull()
      .references(() => levels.id),
    lessonNumber: integer("lesson_number").notNull(),
    title: text("title").notNull(),
    audioUrl: text("audio_url"),
    audioUploadKey: text("audio_upload_key"),
    audioFileName: text("audio_file_name"),
    audioFileSize: integer("audio_file_size"),
    audioUploadedAt: timestamp("audio_uploaded_at", { withTimezone: true }),
    notesContent: text("notes_content"),
    responsePrompt: text("response_prompt"),
    responseMarkingGuide: text("response_marking_guide"),
    status: lessonStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("lessons_level_idx").on(t.levelId),
    uniqueIndex("lessons_level_number_idx").on(t.levelId, t.lessonNumber),
  ],
);

// ─── Quiz questions ─────────────────────────────────────────────────────────

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    questionType: questionTypeEnum("question_type").notNull(),
    questionText: text("question_text").notNull(),
    options: jsonb("options").$type<string[]>(),
    correctAnswer: text("correct_answer"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("quiz_questions_lesson_idx").on(t.lessonId)],
);

// ─── Student progress ───────────────────────────────────────────────────────

export const studentProgress = pgTable(
  "student_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    audioListened: boolean("audio_listened").notNull().default(false),
    notesRead: boolean("notes_read").notNull().default(false),
    quizPassed: boolean("quiz_passed").notNull().default(false),
    highestQuizScore: integer("highest_quiz_score"),
    writtenApproved: boolean("written_approved").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("student_progress_user_lesson_idx").on(t.userId, t.lessonId),
    index("student_progress_user_idx").on(t.userId),
  ],
);

// ─── Quiz attempts ──────────────────────────────────────────────────────────

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    answers: jsonb("answers")
      .notNull()
      .$type<Record<string, string>>(),
    score: integer("score").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("quiz_attempts_user_lesson_idx").on(t.userId, t.lessonId)],
);

// ─── Written submissions ────────────────────────────────────────────────────

export const writtenSubmissions = pgTable(
  "written_submissions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    content: text("content").notNull().default(""),
    status: submissionStatusEnum("status").notNull().default("draft"),
    reviewerNote: text("reviewer_note"),
    assignedTo: text("assigned_to").references(() => users.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by").references(() => users.id),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("written_submissions_user_lesson_idx").on(t.userId, t.lessonId),
    index("written_submissions_status_idx").on(t.status),
    index("written_submissions_assigned_to_idx").on(t.assignedTo),
  ],
);

// ─── Level graduations ──────────────────────────────────────────────────────

export const levelGraduations = pgTable(
  "level_graduations",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    levelId: integer("level_id")
      .notNull()
      .references(() => levels.id),
    graduatedAt: timestamp("graduated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    graduatedBy: text("graduated_by").references(() => users.id),
    isOverride: boolean("is_override").notNull().default(false),
  },
  (t) => [
    uniqueIndex("level_graduations_user_level_idx").on(t.userId, t.levelId),
  ],
);

// ─── Q&A threads ────────────────────────────────────────────────────────────

export const qaThreads = pgTable(
  "qa_threads",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    assignedTo: text("assigned_to").references(() => users.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    status: qaStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("qa_threads_user_idx").on(t.userId),
    index("qa_threads_lesson_idx").on(t.lessonId),
    index("qa_threads_status_idx").on(t.status),
    index("qa_threads_assigned_to_idx").on(t.assignedTo),
  ],
);

// ─── Q&A messages ───────────────────────────────────────────────────────────

export const qaMessages = pgTable(
  "qa_messages",
  {
    id: serial("id").primaryKey(),
    threadId: integer("thread_id")
      .notNull()
      .references(() => qaThreads.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    authorRole: qaAuthorRoleEnum("author_role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("qa_messages_thread_idx").on(t.threadId)],
);

// ─── Reviewer assignments ───────────────────────────────────────────────────

export const reviewerAssignments = pgTable(
  "reviewer_assignments",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    levelId: integer("level_id")
      .notNull()
      .references(() => levels.id),
  },
  (t) => [
    uniqueIndex("reviewer_assignments_user_level_idx").on(t.userId, t.levelId),
  ],
);

// ─── Teachings ───────────────────────────────────────────────────────────────

export const teachings = pgTable("teachings", {
  id: serial("id").primaryKey(),
  sn: integer("sn").notNull(),
  title: text("title").notNull(),
  series: text("series").notNull(),
  date: text("date"),
  audioUrl: text("audio_url").notNull(),
  fileKey: text("file_key").notNull(),
  duration: integer("duration"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Push subscriptions ─────────────────────────────────────────────────────

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("push_subscriptions_user_idx").on(t.userId),
    uniqueIndex("push_subscriptions_endpoint_idx").on(t.endpoint),
  ],
);

// ─── Prayer watch attendance ────────────────────────────────────────────────

export const prayerWatchAttendance = pgTable(
  "prayer_watch_attendance",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attendedDate: date("attended_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("prayer_watch_attendance_user_date_idx").on(
      t.userId,
      t.attendedDate,
    ),
    index("prayer_watch_attendance_user_idx").on(t.userId),
  ],
);

// ─── Contact submissions ────────────────────────────────────────────────────

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: serial("id").primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    location: text("location"),
    message: text("message").notNull(),
    status: contactSubmissionStatusEnum("status").notNull().default("new"),
    isSpam: boolean("is_spam").notNull().default(false),
    spamReasons: jsonb("spam_reasons")
      .notNull()
      .$type<string[]>()
      .default(sql`'[]'::jsonb`),
    honeypotValue: text("honeypot_value"),
    formStartedAt: timestamp("form_started_at", { withTimezone: true }),
    submitDurationMs: integer("submit_duration_ms"),
    notificationSentAt: timestamp("notification_sent_at", { withTimezone: true }),
    notificationFailure: text("notification_failure"),
    readAt: timestamp("read_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("contact_submissions_status_idx").on(t.status),
    index("contact_submissions_is_spam_idx").on(t.isSpam),
    index("contact_submissions_created_at_idx").on(t.createdAt),
  ],
);

// ─── School of Purpose waitlist ─────────────────────────────────────────────

export const schoolOfPurposeWaitlist = pgTable(
  "school_of_purpose_waitlist",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("school_of_purpose_waitlist_email_idx").on(t.email),
    index("school_of_purpose_waitlist_created_at_idx").on(t.createdAt),
  ],
);
