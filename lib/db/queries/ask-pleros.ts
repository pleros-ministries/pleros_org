import { and, asc, desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import {
  staffAskerView,
  type QuestionStatus,
  type StaffAskerView,
} from "@/lib/community/ask-pleros";

/**
 * Ask Pleros storage. Reads are split in two on purpose:
 *
 * - "ForAsker" functions are keyed on the asker's own user id.
 * - "ForStaff" functions never select `asker_id`, and compute the asker's name
 *   and group in SQL as null when the question is anonymous, so an anonymous
 *   identity never leaves the database on the staff path.
 *
 * `getQuestionDeliveryTarget` is the single exception: it resolves the account
 * so a reply can be delivered, and its result must stay on the server.
 */

const questions = schema.plerosQuestions;
const messages = schema.plerosQuestionMessages;

const PREVIEW_LENGTH = 140;

/** The opening message of the question in the current row. */
const firstMessageSql = sql<string | null>`(
  select ${messages.body} from ${messages}
  where ${messages.questionId} = ${questions.id}
  order by ${messages.id} asc
  limit 1
)`;

function preview(body: string | null): string {
  const flat = (body ?? "").replace(/\s+/g, " ").trim();
  return flat.length > PREVIEW_LENGTH
    ? `${flat.slice(0, PREVIEW_LENGTH - 1)}…`
    : flat;
}

export type QuestionMessage = {
  id: number;
  fromStaff: boolean;
  body: string;
  createdAt: string;
};

async function listMessages(questionId: number): Promise<QuestionMessage[]> {
  const rows = await db
    .select({
      id: messages.id,
      fromStaff: messages.fromStaff,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.questionId, questionId))
    .orderBy(asc(messages.id));
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

// ─── The asker's side ──────────────────────────────────────────────────────

export type AskerQuestionSummary = {
  id: number;
  status: QuestionStatus;
  isAnonymous: boolean;
  unread: boolean;
  preview: string;
  lastMessageAt: string;
};

export async function listQuestionsForAsker(
  askerId: string,
): Promise<AskerQuestionSummary[]> {
  const rows = await db
    .select({
      id: questions.id,
      status: questions.status,
      isAnonymous: questions.isAnonymous,
      unread: questions.askerUnread,
      firstMessage: firstMessageSql,
      lastMessageAt: questions.lastMessageAt,
    })
    .from(questions)
    .where(eq(questions.askerId, askerId))
    .orderBy(desc(questions.lastMessageAt))
    .limit(100);

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    isAnonymous: row.isAnonymous,
    unread: row.unread,
    preview: preview(row.firstMessage),
    lastMessageAt: row.lastMessageAt.toISOString(),
  }));
}

export type AskerQuestion = {
  id: number;
  status: QuestionStatus;
  isAnonymous: boolean;
  messages: QuestionMessage[];
};

/** One conversation, for the person who asked it only. */
export async function getQuestionForAsker(
  askerId: string,
  questionId: number,
): Promise<AskerQuestion | null> {
  const [row] = await db
    .select({
      id: questions.id,
      status: questions.status,
      isAnonymous: questions.isAnonymous,
    })
    .from(questions)
    .where(and(eq(questions.id, questionId), eq(questions.askerId, askerId)))
    .limit(1);
  if (!row) return null;
  return { ...row, messages: await listMessages(questionId) };
}

export async function countUnreadQuestionsForAsker(
  askerId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(questions)
    .where(and(eq(questions.askerId, askerId), eq(questions.askerUnread, true)));
  return row?.n ?? 0;
}

/** Questions the person opened and messages they sent, for the rate limits. */
export async function countRecentAskerActivity(
  askerId: string,
  since: { questions: Date; messages: Date },
): Promise<{ questions: number; messages: number }> {
  const [[asked], [sent]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(questions)
      .where(
        and(
          eq(questions.askerId, askerId),
          gte(questions.createdAt, since.questions),
        ),
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(questions, eq(questions.id, messages.questionId))
      .where(
        and(
          eq(questions.askerId, askerId),
          eq(messages.fromStaff, false),
          gte(messages.createdAt, since.messages),
        ),
      ),
  ]);
  return { questions: asked?.n ?? 0, messages: sent?.n ?? 0 };
}

export async function isAskerMuted(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ userId: schema.plerosQuestionMutes.userId })
    .from(schema.plerosQuestionMutes)
    .where(eq(schema.plerosQuestionMutes.userId, userId))
    .limit(1);
  return Boolean(row);
}

/** Opens a conversation with its first message, in one transaction. */
export async function createQuestion(input: {
  askerId: string;
  isAnonymous: boolean;
  body: string;
}): Promise<{ id: number }> {
  return transactionDb.transaction(async (tx) => {
    const [question] = await tx
      .insert(questions)
      .values({ askerId: input.askerId, isAnonymous: input.isAnonymous })
      .returning({ id: questions.id });
    await tx.insert(messages).values({
      questionId: question.id,
      fromStaff: false,
      body: input.body,
    });
    return { id: question.id };
  });
}

/** A follow-up from the asker; it puts the conversation back in the open queue. */
export async function addAskerMessage(input: {
  questionId: number;
  body: string;
}): Promise<void> {
  await transactionDb.transaction(async (tx) => {
    await tx.insert(messages).values({
      questionId: input.questionId,
      fromStaff: false,
      body: input.body,
    });
    await tx
      .update(questions)
      .set({ status: "open", lastMessageAt: new Date() })
      .where(eq(questions.id, input.questionId));
  });
}

export async function markQuestionReadByAsker(
  askerId: string,
  questionId: number,
) {
  await db
    .update(questions)
    .set({ askerUnread: false })
    .where(and(eq(questions.id, questionId), eq(questions.askerId, askerId)));
}

/** The asker chooses to show their name on one conversation. One-way. */
export async function revealQuestionAsker(askerId: string, questionId: number) {
  await db
    .update(questions)
    .set({ isAnonymous: false })
    .where(and(eq(questions.id, questionId), eq(questions.askerId, askerId)));
}

// ─── The staff side: no asker id, no anonymous names ───────────────────────

/** Null for an anonymous question, so the name never reaches the server code. */
const staffNameSql = sql<string | null>`case
  when ${questions.isAnonymous} then null
  else ${schema.users.name}
end`;

/** The asker's location group, or null for an anonymous question. */
const staffGroupSql = sql<string | null>`case
  when ${questions.isAnonymous} then null
  else (
    select ${schema.units.name} from ${schema.sogpEnrollments}
    inner join ${schema.unitMembers}
      on ${schema.unitMembers.enrollmentId} = ${schema.sogpEnrollments.id}
    inner join ${schema.units}
      on ${schema.units.id} = ${schema.unitMembers.unitId}
    where ${schema.sogpEnrollments.userId} = ${questions.askerId}
    order by ${schema.sogpEnrollments.createdAt}
    limit 1
  )
end`;

export type StaffQuestionSummary = {
  id: number;
  status: QuestionStatus;
  asker: StaffAskerView;
  preview: string;
  lastMessageAt: string;
};

/** Every conversation, newest activity first. */
export async function listQuestionsForStaff(): Promise<StaffQuestionSummary[]> {
  const rows = await db
    .select({
      id: questions.id,
      status: questions.status,
      isAnonymous: questions.isAnonymous,
      name: staffNameSql,
      groupName: staffGroupSql,
      firstMessage: firstMessageSql,
      lastMessageAt: questions.lastMessageAt,
    })
    .from(questions)
    .innerJoin(schema.users, eq(schema.users.id, questions.askerId))
    .orderBy(desc(questions.lastMessageAt))
    .limit(300);

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    asker: staffAskerView(row),
    preview: preview(row.firstMessage),
    lastMessageAt: row.lastMessageAt.toISOString(),
  }));
}

export type StaffQuestion = {
  id: number;
  status: QuestionStatus;
  asker: StaffAskerView;
  createdAt: string;
  messages: QuestionMessage[];
};

export async function getQuestionForStaff(
  questionId: number,
): Promise<StaffQuestion | null> {
  const [row] = await db
    .select({
      id: questions.id,
      status: questions.status,
      isAnonymous: questions.isAnonymous,
      name: staffNameSql,
      groupName: staffGroupSql,
      createdAt: questions.createdAt,
    })
    .from(questions)
    .innerJoin(schema.users, eq(schema.users.id, questions.askerId))
    .where(eq(questions.id, questionId))
    .limit(1);
  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    asker: staffAskerView(row),
    createdAt: row.createdAt.toISOString(),
    messages: await listMessages(questionId),
  };
}

/** Pleros replies: the conversation is answered and the asker has something unread. */
export async function addStaffReply(input: {
  questionId: number;
  staffUserId: string;
  body: string;
}): Promise<void> {
  await transactionDb.transaction(async (tx) => {
    await tx.insert(messages).values({
      questionId: input.questionId,
      fromStaff: true,
      staffAuthorId: input.staffUserId,
      body: input.body,
    });
    await tx
      .update(questions)
      .set({ status: "answered", askerUnread: true, lastMessageAt: new Date() })
      .where(eq(questions.id, input.questionId));
  });
}

export async function setQuestionStatus(
  questionId: number,
  status: QuestionStatus,
) {
  await db
    .update(questions)
    .set({ status })
    .where(eq(questions.id, questionId));
}

/**
 * Stops further questions from whoever asked this one, without telling the
 * caller who that is. The mute list is never displayed anywhere.
 */
export async function muteQuestionAsker(questionId: number): Promise<void> {
  // The asker id is read and used here only; it is not returned.
  const [row] = await db
    .select({ askerId: questions.askerId })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);
  if (!row) return;
  await db
    .insert(schema.plerosQuestionMutes)
    .values({ userId: row.askerId })
    .onConflictDoNothing();
}

/**
 * SERVER ONLY. The account behind a question, so a reply can be delivered by
 * notification and email. Never return this from an action or route, and never
 * render it: for an anonymous question it is exactly what staff must not see.
 */
export async function getQuestionDeliveryTarget(
  questionId: number,
): Promise<{ userId: string; email: string } | null> {
  const [row] = await db
    .select({ userId: schema.users.id, email: schema.users.email })
    .from(questions)
    .innerJoin(schema.users, eq(schema.users.id, questions.askerId))
    .where(eq(questions.id, questionId))
    .limit(1);
  return row ?? null;
}
