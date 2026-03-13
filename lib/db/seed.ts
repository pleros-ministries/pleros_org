import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const LEVEL_CONFIG = [
  { id: 1, title: "Level 1", description: "Foundations of faith and Christian living", lessonCount: 5 },
  { id: 2, title: "Level 2", description: "Deepening understanding of scripture", lessonCount: 11 },
  { id: 3, title: "Level 3", description: "Practical ministry and service", lessonCount: 30 },
  { id: 4, title: "Level 4", description: "Leadership and discipleship", lessonCount: 60 },
  { id: 5, title: "Level 5", description: "Advanced theology and mission", lessonCount: 300 },
];

const DEMO_USERS = [
  { id: "admin-001", name: "Admin User", email: "admin@pleros.test", role: "admin" as const, location: "Lagos, NG" },
  { id: "inst-001", name: "Instructor One", email: "instructor@pleros.test", role: "instructor" as const, location: "Abuja, NG" },
  { id: "stu-001", name: "Ada Nwosu", email: "ada@pleros.test", role: "student" as const, location: "Lagos, NG" },
  { id: "stu-002", name: "Ben Udo", email: "ben@pleros.test", role: "student" as const, location: "Abuja, NG" },
  { id: "stu-003", name: "Chiamaka Obi", email: "chiamaka@pleros.test", role: "student" as const, location: "Port Harcourt, NG" },
  { id: "stu-004", name: "Deborah Ibe", email: "deborah@pleros.test", role: "student" as const, location: "Enugu, NG" },
  { id: "stu-005", name: "Emeka Yusuf", email: "emeka@pleros.test", role: "student" as const, location: "Kaduna, NG" },
  { id: "stu-006", name: "Favour Bassey", email: "favour@pleros.test", role: "student" as const, location: "Calabar, NG" },
  { id: "stu-007", name: "Gloria Mensah", email: "gloria@pleros.test", role: "student" as const, location: "Accra, GH" },
  { id: "stu-008", name: "Henry Okon", email: "henry@pleros.test", role: "student" as const, location: "Uyo, NG" },
  { id: "stu-009", name: "Ifeoma Okeke", email: "ifeoma@pleros.test", role: "student" as const, location: "Onitsha, NG" },
  { id: "stu-010", name: "James Adeyemi", email: "james@pleros.test", role: "student" as const, location: "Ibadan, NG" },
];

function generateLessonTitle(level: number, lesson: number): string {
  const topics: Record<number, string[]> = {
    1: ["The call to discipleship", "Understanding grace", "Prayer foundations", "Walking in faith", "The heart of worship"],
    2: ["Old Testament overview", "New Testament survey", "The Psalms", "Prophetic books", "The Gospels", "Acts of the Apostles", "Pauline epistles", "General epistles", "Revelation introduction", "Biblical hermeneutics", "Scripture memorization"],
    3: Array.from({ length: 30 }, (_, i) => `Ministry practice ${i + 1}`),
    4: Array.from({ length: 60 }, (_, i) => `Leadership study ${i + 1}`),
    5: Array.from({ length: 300 }, (_, i) => `Advanced study ${i + 1}`),
  };
  return topics[level]?.[lesson - 1] ?? `Lesson ${lesson}`;
}

const sampleNotes = `## Teaching Notes

This lesson covers foundational principles that every believer should understand.

### Key Points
- God's grace is sufficient for all circumstances
- Prayer is the foundation of spiritual growth
- Community and fellowship strengthen our walk

### Reflection
Take time to meditate on the scriptures referenced in the audio teaching. Journal your thoughts and any questions that arise.

### Memory Verse
"For by grace you have been saved through faith. And this is not your own doing; it is the gift of God." - Ephesians 2:8`;

function generateQuizQuestions(lessonId: number, lessonNumber: number) {
  return [
    {
      lessonId,
      questionType: "multiple_choice" as const,
      questionText: `What is the primary theme of lesson ${lessonNumber}?`,
      options: ["Grace and redemption", "Prayer and worship", "Service and ministry", "Faith and obedience"],
      correctAnswer: "Grace and redemption",
      sortOrder: 1,
    },
    {
      lessonId,
      questionType: "multiple_choice" as const,
      questionText: `Which scripture is most relevant to the teaching in lesson ${lessonNumber}?`,
      options: ["Ephesians 2:8", "Romans 8:28", "John 3:16", "Philippians 4:13"],
      correctAnswer: "Ephesians 2:8",
      sortOrder: 2,
    },
    {
      lessonId,
      questionType: "short_text" as const,
      questionText: "In your own words, summarize the key takeaway from this lesson.",
      options: null,
      correctAnswer: null,
      sortOrder: 3,
    },
  ];
}

async function seed() {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED!);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Clear existing data in reverse dependency order
  await db.delete(schema.qaMessages);
  await db.delete(schema.qaThreads);
  await db.delete(schema.writtenSubmissions);
  await db.delete(schema.quizAttempts);
  await db.delete(schema.studentProgress);
  await db.delete(schema.levelGraduations);
  await db.delete(schema.reviewerAssignments);
  await db.delete(schema.quizQuestions);
  await db.delete(schema.lessons);
  await db.delete(schema.users);
  await db.delete(schema.levels);

  // Seed levels
  for (const level of LEVEL_CONFIG) {
    await db.insert(schema.levels).values({
      id: level.id,
      title: level.title,
      description: level.description,
      lessonCount: level.lessonCount,
      sortOrder: level.id,
    });
  }
  console.log("  Levels seeded");

  // Seed users
  for (const user of DEMO_USERS) {
    await db.insert(schema.users).values({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: true,
      location: user.location,
    });
  }
  console.log("  Users seeded");

  // Seed lessons for levels 1 and 2 fully, plus a few for levels 3-5
  const lessonSeedCounts = { 1: 5, 2: 11, 3: 10, 4: 10, 5: 10 };
  const insertedLessonIds: Record<string, number> = {};

  for (const level of LEVEL_CONFIG) {
    const count = lessonSeedCounts[level.id as keyof typeof lessonSeedCounts] ?? 5;
    for (let n = 1; n <= count; n++) {
      const result = await db
        .insert(schema.lessons)
        .values({
          levelId: level.id,
          lessonNumber: n,
          title: generateLessonTitle(level.id, n),
          audioUrl: `https://example.com/audio/level-${level.id}/lesson-${n}.mp3`,
          notesContent: sampleNotes,
          status: "published",
        })
        .returning({ id: schema.lessons.id });
      insertedLessonIds[`${level.id}-${n}`] = result[0].id;
    }
  }
  console.log("  Lessons seeded");

  // Seed quiz questions for levels 1 and 2
  for (const level of [1, 2]) {
    const count = lessonSeedCounts[level];
    for (let n = 1; n <= count; n++) {
      const lessonId = insertedLessonIds[`${level}-${n}`];
      if (!lessonId) continue;
      const questions = generateQuizQuestions(lessonId, n);
      for (const q of questions) {
        await db.insert(schema.quizQuestions).values(q);
      }
    }
  }
  console.log("  Quiz questions seeded");

  // Seed student progress for demo students
  const studentProgressData: { userId: string; level: number; completedLessons: number }[] = [
    { userId: "stu-001", level: 2, completedLessons: 5 },
    { userId: "stu-002", level: 1, completedLessons: 4 },
    { userId: "stu-003", level: 3, completedLessons: 1 },
    { userId: "stu-004", level: 4, completedLessons: 3 },
    { userId: "stu-005", level: 5, completedLessons: 7 },
    { userId: "stu-006", level: 2, completedLessons: 9 },
    { userId: "stu-007", level: 3, completedLessons: 5 },
    { userId: "stu-008", level: 1, completedLessons: 1 },
    { userId: "stu-009", level: 4, completedLessons: 6 },
    { userId: "stu-010", level: 5, completedLessons: 9 },
  ];

  for (const sp of studentProgressData) {
    // Graduate previous levels
    for (let l = 1; l < sp.level; l++) {
      await db.insert(schema.levelGraduations).values({
        userId: sp.userId,
        levelId: l,
        graduatedBy: "admin-001",
      });
    }

    // Add progress for current level lessons
    for (let n = 1; n <= sp.completedLessons; n++) {
      const lessonId = insertedLessonIds[`${sp.level}-${n}`];
      if (!lessonId) continue;
      await db.insert(schema.studentProgress).values({
        userId: sp.userId,
        lessonId,
        audioListened: true,
        notesRead: true,
        quizPassed: true,
        highestQuizScore: 80 + Math.floor(Math.random() * 20),
        writtenApproved: true,
        completedAt: new Date(),
      });
    }
  }
  console.log("  Student progress seeded");

  // Seed reviewer assignments
  await db.insert(schema.reviewerAssignments).values({ userId: "inst-001", levelId: 1 });
  await db.insert(schema.reviewerAssignments).values({ userId: "inst-001", levelId: 2 });
  console.log("  Reviewer assignments seeded");

  // Seed some Q&A threads
  const qaData = [
    { userId: "stu-002", lessonKey: "1-5", subject: "Clarification on prayer cadence in Lesson 5" },
    { userId: "stu-001", lessonKey: "2-6", subject: "Difference between reflection and confession tasks" },
    { userId: "stu-005", lessonKey: "5-7", subject: "How to approach Lesson 7 prerequisites" },
  ];
  for (const qa of qaData) {
    const lessonId = insertedLessonIds[qa.lessonKey];
    if (!lessonId) continue;
    const [thread] = await db
      .insert(schema.qaThreads)
      .values({ userId: qa.userId, lessonId, subject: qa.subject, status: "open" })
      .returning({ id: schema.qaThreads.id });
    await db.insert(schema.qaMessages).values({
      threadId: thread.id,
      authorId: qa.userId,
      authorRole: "student",
      content: "I have a question about the material covered in this lesson. Could you help clarify?",
    });
  }
  console.log("  Q&A threads seeded");

  // Seed some written submissions and review items
  const submissionData = [
    { userId: "stu-001", lessonKey: "2-6", status: "submitted" as const },
    { userId: "stu-004", lessonKey: "4-4", status: "needs_revision" as const, reviewerNote: "Please expand on the practical application section." },
    { userId: "stu-007", lessonKey: "3-6", status: "submitted" as const },
    { userId: "stu-009", lessonKey: "4-7", status: "submitted" as const },
    { userId: "stu-005", lessonKey: "5-8", status: "submitted" as const },
  ];
  for (const sub of submissionData) {
    const lessonId = insertedLessonIds[sub.lessonKey];
    if (!lessonId) continue;
    await db.insert(schema.writtenSubmissions).values({
      userId: sub.userId,
      lessonId,
      content: "This is my written response to the lesson material. I reflected on the key teachings and applied them to my personal faith journey.",
      status: sub.status,
      reviewerNote: sub.reviewerNote ?? null,
      submittedAt: new Date(),
    });
  }
  console.log("  Written submissions seeded");

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
