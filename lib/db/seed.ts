import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // ─── Users ────────────────────────────────────────────────────────────────
  const userRows = [
    { id: "admin-1", name: "Grace Admin", email: "admin@pleros.test", role: "admin" as const, location: "Cape Town, ZA" },
    { id: "instructor-1", name: "James Instructor", email: "instructor@pleros.test", role: "instructor" as const, location: "Nairobi, KE" },
    { id: "student-ada", name: "Ada Lovelace", email: "ada@pleros.test", role: "student" as const, startingLevel: 1, location: "London, UK" },
    { id: "student-ben", name: "Ben Carson", email: "ben@pleros.test", role: "student" as const, startingLevel: 1, location: "Detroit, US" },
    { id: "student-chi", name: "Chi Zhang", email: "chi@pleros.test", role: "student" as const, startingLevel: 1, location: "Shanghai, CN" },
    { id: "student-david", name: "David Okafor", email: "david@pleros.test", role: "student" as const, startingLevel: 1, location: "Lagos, NG" },
    { id: "student-elena", name: "Elena Petrov", email: "elena@pleros.test", role: "student" as const, startingLevel: 1, location: "Moscow, RU" },
    { id: "student-fatima", name: "Fatima Hassan", email: "fatima@pleros.test", role: "student" as const, startingLevel: 2, location: "Cairo, EG" },
    { id: "student-george", name: "George Mensah", email: "george@pleros.test", role: "student" as const, startingLevel: 1, location: "Accra, GH" },
    { id: "student-hana", name: "Hana Kimura", email: "hana@pleros.test", role: "student" as const, startingLevel: 1, location: "Tokyo, JP" },
    { id: "student-ivan", name: "Ivan Reyes", email: "ivan@pleros.test", role: "student" as const, startingLevel: 1, location: "Manila, PH" },
    { id: "student-julia", name: "Julia Santos", email: "julia@pleros.test", role: "student" as const, startingLevel: 1, location: "São Paulo, BR" },
  ];

  for (const user of userRows) {
    await db.insert(schema.users).values(user).onConflictDoNothing();
  }
  console.log(`  ✓ ${userRows.length} users`);

  // ─── Levels ───────────────────────────────────────────────────────────────
  const levelRows = [
    { id: 1, title: "Level 1 – Foundations", description: "Core Gospel foundations and basic Christian doctrine.", lessonCount: 5, sortOrder: 1 },
    { id: 2, title: "Level 2 – Growth", description: "Deepening understanding of Scripture and personal growth.", lessonCount: 11, sortOrder: 2 },
    { id: 3, title: "Level 3 – Ministry", description: "Practical ministry skills and servant leadership.", lessonCount: 30, sortOrder: 3 },
    { id: 4, title: "Level 4 – Leadership", description: "Advanced leadership principles and church planting.", lessonCount: 60, sortOrder: 4 },
    { id: 5, title: "Level 5 – Mastery", description: "Comprehensive mastery and mentorship training.", lessonCount: 300, sortOrder: 5 },
  ];

  for (const level of levelRows) {
    await db.insert(schema.levels).values(level).onConflictDoNothing();
  }
  console.log(`  ✓ ${levelRows.length} levels`);

  // ─── Lessons ──────────────────────────────────────────────────────────────
  const lessonSets: { levelId: number; count: number }[] = [
    { levelId: 1, count: 5 },
    { levelId: 2, count: 11 },
    { levelId: 3, count: 10 },
    { levelId: 4, count: 10 },
    { levelId: 5, count: 10 },
  ];

  const lessonTitles: Record<number, string[]> = {
    1: ["The Gospel message", "Salvation and grace", "The nature of God", "Prayer foundations", "The Bible as God's Word"],
    2: ["Old Testament overview", "New Testament overview", "The Holy Spirit", "Spiritual gifts", "Worship in spirit", "Faith and works", "The church body", "Baptism and communion", "Forgiveness and reconciliation", "Stewardship", "Evangelism basics"],
    3: ["Preaching foundations", "Teaching methods", "Pastoral care", "Small group leadership", "Community outreach", "Discipleship models", "Conflict resolution", "Cross-cultural ministry", "Youth ministry", "Missions awareness"],
    4: ["Vision casting", "Strategic planning", "Team building", "Financial management", "Church governance", "Mentoring leaders", "Church planting 101", "Urban ministry", "Rural ministry", "Digital ministry"],
    5: ["Advanced hermeneutics", "Systematic theology review", "Apologetics", "World religions survey", "Ethics in leadership", "Seminary-level exegesis", "Counseling foundations", "Organizational development", "Global missions strategy", "Capstone project"],
  };

  let totalLessons = 0;
  for (const set of lessonSets) {
    const titles = lessonTitles[set.levelId]!;
    for (let i = 0; i < set.count; i++) {
      await db.insert(schema.lessons).values({
        levelId: set.levelId,
        lessonNumber: i + 1,
        title: titles[i] ?? `Lesson ${i + 1}`,
        audioUrl: `https://placeholder.pleros.test/audio/level-${set.levelId}/lesson-${i + 1}.mp3`,
        notesContent: `# ${titles[i] ?? `Lesson ${i + 1}`}\n\nThis is the teaching content for this lesson. In production, this will contain rich markdown notes covering the key points of the audio teaching.\n\n## Key points\n\n- Point one: Understanding the foundational concept\n- Point two: Applying the teaching practically\n- Point three: Reflecting on personal growth\n\n## Scripture references\n\n- Reference passages will be listed here\n- Additional study material and context`,
        status: "published",
      }).onConflictDoNothing();
      totalLessons++;
    }
  }
  console.log(`  ✓ ${totalLessons} lessons`);

  // ─── Quiz questions ───────────────────────────────────────────────────────
  const l1l2Lessons = await db.query.lessons.findMany({
    where: (l, { inArray }) => inArray(l.levelId, [1, 2]),
    orderBy: (l, { asc }) => [asc(l.levelId), asc(l.lessonNumber)],
  });

  let totalQuestions = 0;
  for (const lesson of l1l2Lessons) {
    const questions = [
      {
        lessonId: lesson.id,
        questionType: "multiple_choice" as const,
        questionText: `What is the main theme of "${lesson.title}"?`,
        options: ["Option A: The primary concept", "Option B: A secondary idea", "Option C: An unrelated topic", "Option D: None of the above"],
        correctAnswer: "Option A: The primary concept",
        sortOrder: 1,
      },
      {
        lessonId: lesson.id,
        questionType: "multiple_choice" as const,
        questionText: `Which Scripture passage is most relevant to "${lesson.title}"?`,
        options: ["John 3:16", "Romans 8:28", "Psalm 23:1", "Matthew 28:19"],
        correctAnswer: "John 3:16",
        sortOrder: 2,
      },
      {
        lessonId: lesson.id,
        questionType: "short_text" as const,
        questionText: `In your own words, explain the key takeaway from "${lesson.title}".`,
        options: null,
        correctAnswer: null,
        sortOrder: 3,
      },
    ];

    for (const q of questions) {
      await db.insert(schema.quizQuestions).values(q).onConflictDoNothing();
      totalQuestions++;
    }
  }
  console.log(`  ✓ ${totalQuestions} quiz questions`);

  // ─── Student progress ─────────────────────────────────────────────────────
  // Ada: graduated L1, on L2 lesson 4
  const l1Lessons = l1l2Lessons.filter((l) => l.levelId === 1);
  const l2Lessons = l1l2Lessons.filter((l) => l.levelId === 2);

  for (const lesson of l1Lessons) {
    await db.insert(schema.studentProgress).values({
      userId: "student-ada",
      lessonId: lesson.id,
      audioListened: true,
      notesRead: true,
      quizPassed: true,
      highestQuizScore: 90,
      writtenApproved: true,
      completedAt: new Date(),
    }).onConflictDoNothing();
  }

  for (let i = 0; i < 3; i++) {
    if (l2Lessons[i]) {
      await db.insert(schema.studentProgress).values({
        userId: "student-ada",
        lessonId: l2Lessons[i].id,
        audioListened: true,
        notesRead: true,
        quizPassed: true,
        highestQuizScore: 85,
        writtenApproved: true,
        completedAt: new Date(),
      }).onConflictDoNothing();
    }
  }

  if (l2Lessons[3]) {
    await db.insert(schema.studentProgress).values({
      userId: "student-ada",
      lessonId: l2Lessons[3].id,
      audioListened: true,
      notesRead: true,
      quizPassed: false,
      writtenApproved: false,
    }).onConflictDoNothing();
  }

  // Ben: on L1 lesson 3
  for (let i = 0; i < 2; i++) {
    if (l1Lessons[i]) {
      await db.insert(schema.studentProgress).values({
        userId: "student-ben",
        lessonId: l1Lessons[i].id,
        audioListened: true,
        notesRead: true,
        quizPassed: true,
        highestQuizScore: 80,
        writtenApproved: true,
        completedAt: new Date(),
      }).onConflictDoNothing();
    }
  }

  if (l1Lessons[2]) {
    await db.insert(schema.studentProgress).values({
      userId: "student-ben",
      lessonId: l1Lessons[2].id,
      audioListened: true,
      notesRead: false,
      quizPassed: false,
      writtenApproved: false,
    }).onConflictDoNothing();
  }

  console.log("  ✓ student progress (Ada L2, Ben L1)");

  // ─── Level graduations ────────────────────────────────────────────────────
  await db.insert(schema.levelGraduations).values({
    userId: "student-ada",
    levelId: 1,
    graduatedBy: "instructor-1",
  }).onConflictDoNothing();
  console.log("  ✓ 1 graduation (Ada L1)");

  // ─── Written submissions ──────────────────────────────────────────────────
  const submissionData = [
    { userId: "student-ada", lessonId: l2Lessons[0]?.id, content: "My reflection on this teaching is that it provides a strong foundation...", status: "approved" as const, reviewedBy: "instructor-1" },
    { userId: "student-ada", lessonId: l2Lessons[1]?.id, content: "The key insight I gained from this lesson is the importance of...", status: "approved" as const, reviewedBy: "instructor-1" },
    { userId: "student-ada", lessonId: l2Lessons[2]?.id, content: "I found this lesson particularly challenging because...", status: "submitted" as const },
    { userId: "student-ben", lessonId: l1Lessons[0]?.id, content: "This lesson opened my eyes to the reality of God's grace...", status: "approved" as const, reviewedBy: "instructor-1" },
    { userId: "student-ben", lessonId: l1Lessons[1]?.id, content: "I need to revise my understanding of this topic...", status: "needs_revision" as const, reviewedBy: "instructor-1", reviewerNote: "Please expand on how this applies to daily life." },
  ];

  for (const sub of submissionData) {
    if (!sub.lessonId) continue;
    await db.insert(schema.writtenSubmissions).values({
      userId: sub.userId,
      lessonId: sub.lessonId,
      content: sub.content,
      status: sub.status,
      reviewedBy: sub.reviewedBy ?? null,
      reviewerNote: sub.reviewerNote ?? null,
      submittedAt: new Date(),
      reviewedAt: sub.reviewedBy ? new Date() : null,
    }).onConflictDoNothing();
  }
  console.log(`  ✓ ${submissionData.length} written submissions`);

  // ─── Q&A threads + messages ───────────────────────────────────────────────
  const threadData = [
    { userId: "student-ada", lessonId: l2Lessons[1]?.id, subject: "Clarification on covenant types", message: "Could you explain the difference between the old and new covenants in more detail?" },
    { userId: "student-ben", lessonId: l1Lessons[2]?.id, subject: "Struggling with the concept of the Trinity", message: "I'm having difficulty understanding how God can be three persons in one. Can you help?" },
    { userId: "student-chi", lessonId: l1Lessons[0]?.id, subject: "Application of the Gospel in daily life", message: "How do I practically apply the Gospel message in my workplace?" },
  ];

  for (const t of threadData) {
    if (!t.lessonId) continue;
    const [thread] = await db.insert(schema.qaThreads).values({
      userId: t.userId,
      lessonId: t.lessonId,
      subject: t.subject,
    }).returning();

    if (thread) {
      await db.insert(schema.qaMessages).values({
        threadId: thread.id,
        authorId: t.userId,
        authorRole: "student",
        content: t.message,
      });
    }
  }
  console.log(`  ✓ ${threadData.length} Q&A threads`);

  // ─── Reviewer assignments ─────────────────────────────────────────────────
  await db.insert(schema.reviewerAssignments).values([
    { userId: "instructor-1", levelId: 1 },
    { userId: "instructor-1", levelId: 2 },
  ]).onConflictDoNothing();
  console.log("  ✓ 2 reviewer assignments");

  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
