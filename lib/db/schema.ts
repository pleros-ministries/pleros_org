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
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
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
]);

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
    status: qaStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("qa_threads_user_idx").on(t.userId),
    index("qa_threads_lesson_idx").on(t.lessonId),
    index("qa_threads_status_idx").on(t.status),
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
