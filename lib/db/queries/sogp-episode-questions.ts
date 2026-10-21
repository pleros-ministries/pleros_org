import "server-only";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { firstNameOf } from "@/lib/community/visibility";
import { getSogpEnrollmentByUserId } from "./sogp";

const BODY_MAX = 2000;
const TITLE_MAX = 300;
const GUID_MAX = 200;
/** Episode questions per asker in a rolling day, mirroring Ask Pleros. */
const ASK_LIMIT = 5;

function cleanText(value: unknown, max: number, message: string): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new CommunityError(message);
  return value.trim();
}

async function ownActiveEnrolment(userId: string) {
  const enrollment = await getSogpEnrollmentByUserId(userId);
  if (!enrollment || enrollment.status === "withdrawn") throw new CommunityError("Enrol in SOGP to ask about an episode.");
  return enrollment;
}

/** The asker's active discipleship placement, if any: group plus its lead. */
async function activePlacement(enrollmentId: number) {
  const [row] = await db.select({ groupId: s.discipleshipGroups.id, disciplerEnrollmentId: s.discipleshipGroups.leaderEnrollmentId, leaderFirstName: s.sogpEnrollments.firstName, leaderName: s.sogpEnrollments.name })
    .from(s.discipleshipMemberships)
    .innerJoin(s.discipleshipGroups, and(eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId), eq(s.discipleshipGroups.status, "active")))
    .innerJoin(s.sogpEnrollments, and(eq(s.sogpEnrollments.id, s.discipleshipGroups.leaderEnrollmentId), ne(s.sogpEnrollments.status, "withdrawn")))
    .where(and(eq(s.discipleshipMemberships.discipleEnrollmentId, enrollmentId), eq(s.discipleshipMemberships.status, "active")))
    .limit(1);
  return row ?? null;
}

/** Where a question about a teaching goes: the leader of your group (named, first name only), else Ask Pleros. */
export async function getEpisodeQuestionRoute(userId: string): Promise<{ kind: "discipler"; leaderFirstName: string } | { kind: "ask-pleros" }> {
  const enrollment = await getSogpEnrollmentByUserId(userId);
  if (!enrollment || enrollment.status === "withdrawn") return { kind: "ask-pleros" };
  const placement = await activePlacement(enrollment.id);
  return placement ? { kind: "discipler", leaderFirstName: firstNameOf(placement.leaderFirstName || placement.leaderName || "your leader") } : { kind: "ask-pleros" };
}

export async function askEpisodeQuestion(userId: string, raw: unknown) {
  if (!raw || typeof raw !== "object") throw new CommunityError("Write your question first.");
  const input = raw as { episodeGuid?: unknown; episodeTitle?: unknown; body?: unknown };
  const episodeGuid = cleanText(input.episodeGuid, GUID_MAX, "This episode is not available for questions.");
  const episodeTitle = cleanText(input.episodeTitle, TITLE_MAX, "This episode is not available for questions.");
  const body = cleanText(input.body, BODY_MAX, "Write your question in 2000 characters or fewer.");
  const enrollment = await ownActiveEnrolment(userId);
  const placement = await activePlacement(enrollment.id);
  if (!placement) throw new CommunityError("Ask Pleros instead: you’re not in a group with a leader right now.");
  const since = new Date(Date.now() - 24 * 3600_000);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.discipleshipEpisodeQuestions)
    .where(and(eq(s.discipleshipEpisodeQuestions.askerEnrollmentId, enrollment.id), gte(s.discipleshipEpisodeQuestions.createdAt, since)));
  if (n >= ASK_LIMIT) throw new CommunityError("You’ve asked several questions today. Try again tomorrow.");
  const [row] = await db.insert(s.discipleshipEpisodeQuestions).values({
    askerEnrollmentId: enrollment.id, groupId: placement.groupId, disciplerEnrollmentId: placement.disciplerEnrollmentId,
    episodeGuid, episodeTitle, body,
  }).returning({ id: s.discipleshipEpisodeQuestions.id });
  if (!row) throw new CommunityError("Your question could not be saved. Try again.");
  const [discipler] = await db.select({ userId: s.sogpEnrollments.userId }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.id, placement.disciplerEnrollmentId)).limit(1);
  return { questionId: row.id, groupId: placement.groupId, disciplerUserId: discipler?.userId ?? null, askerName: firstNameOf(enrollment.firstName || enrollment.name) };
}

export async function replyToEpisodeQuestion(userId: string, raw: unknown) {
  if (!raw || typeof raw !== "object") throw new CommunityError("Write your reply first.");
  const input = raw as { questionId?: unknown; reply?: unknown };
  if (!Number.isSafeInteger(input.questionId) || Number(input.questionId) < 1) throw new CommunityError("This question is not available.");
  const body = cleanText(input.reply, BODY_MAX, "Write your reply in 2000 characters or fewer.");
  const [mine] = await db.select({ id: s.sogpEnrollments.id }).from(s.sogpEnrollments).where(and(eq(s.sogpEnrollments.userId, userId), ne(s.sogpEnrollments.status, "withdrawn"))).limit(1);
  if (!mine) throw new CommunityError("Only this group’s active lead can reply.");
  const [question] = await db.select().from(s.discipleshipEpisodeQuestions)
    .innerJoin(s.discipleshipGroups, and(eq(s.discipleshipGroups.id, s.discipleshipEpisodeQuestions.groupId), eq(s.discipleshipGroups.status, "active"), eq(s.discipleshipGroups.leaderEnrollmentId, mine.id)))
    .innerJoin(s.discipleshipMemberships, and(eq(s.discipleshipMemberships.groupId, s.discipleshipEpisodeQuestions.groupId), eq(s.discipleshipMemberships.discipleEnrollmentId, s.discipleshipEpisodeQuestions.askerEnrollmentId), eq(s.discipleshipMemberships.status, "active")))
    .where(eq(s.discipleshipEpisodeQuestions.id, Number(input.questionId))).limit(1);
  if (!question) throw new CommunityError("This question is no longer available. Only current disciples’ questions can be answered.");
  await db.update(s.discipleshipEpisodeQuestions).set({ reply: body, repliedAt: new Date(), askerUnread: true, updatedAt: new Date() }).where(eq(s.discipleshipEpisodeQuestions.id, Number(input.questionId)));
  const [asker] = await db.select({ userId: s.sogpEnrollments.userId }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.id, question.discipleship_episode_questions.askerEnrollmentId)).limit(1);
  return { askerUserId: asker?.userId ?? null };
}

export type LeaderEpisodeQuestion = {
  id: number; askerEnrollmentId: number; askerName: string; episodeGuid: string; episodeTitle: string;
  body: string; reply: string | null; createdAt: string;
};

export async function getLeaderEpisodeQuestions(userId: string, groupId: number): Promise<LeaderEpisodeQuestion[]> {
  const [mine] = await db.select({ id: s.sogpEnrollments.id }).from(s.sogpEnrollments).where(and(eq(s.sogpEnrollments.userId, userId), ne(s.sogpEnrollments.status, "withdrawn"))).limit(1);
  if (!mine) return [];
  const rows = await db.select({
    id: s.discipleshipEpisodeQuestions.id, askerEnrollmentId: s.discipleshipEpisodeQuestions.askerEnrollmentId,
    firstName: s.sogpEnrollments.firstName, name: s.sogpEnrollments.name,
    episodeGuid: s.discipleshipEpisodeQuestions.episodeGuid, episodeTitle: s.discipleshipEpisodeQuestions.episodeTitle,
    body: s.discipleshipEpisodeQuestions.body, reply: s.discipleshipEpisodeQuestions.reply, createdAt: s.discipleshipEpisodeQuestions.createdAt,
  }).from(s.discipleshipEpisodeQuestions)
    .innerJoin(s.discipleshipGroups, and(eq(s.discipleshipGroups.id, s.discipleshipEpisodeQuestions.groupId), eq(s.discipleshipGroups.leaderEnrollmentId, mine.id), eq(s.discipleshipGroups.status, "active")))
    .innerJoin(s.discipleshipMemberships, and(eq(s.discipleshipMemberships.groupId, s.discipleshipEpisodeQuestions.groupId), eq(s.discipleshipMemberships.discipleEnrollmentId, s.discipleshipEpisodeQuestions.askerEnrollmentId), eq(s.discipleshipMemberships.status, "active")))
    .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.discipleshipEpisodeQuestions.askerEnrollmentId))
    .where(eq(s.discipleshipEpisodeQuestions.groupId, groupId))
    .orderBy(desc(s.discipleshipEpisodeQuestions.createdAt)).limit(50);
  return rows.map(row => ({
    id: row.id, askerEnrollmentId: row.askerEnrollmentId, askerName: firstNameOf(row.firstName || row.name),
    episodeGuid: row.episodeGuid, episodeTitle: row.episodeTitle, body: row.body, reply: row.reply,
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

export type OwnEpisodeQuestion = {
  id: number; episodeGuid: string; episodeTitle: string; body: string;
  reply: string | null; askerUnread: boolean; createdAt: string;
};

export async function getOwnEpisodeQuestions(userId: string): Promise<OwnEpisodeQuestion[]> {
  const enrollment = await getSogpEnrollmentByUserId(userId);
  if (!enrollment) return [];
  const rows = await db.select({
    id: s.discipleshipEpisodeQuestions.id, episodeGuid: s.discipleshipEpisodeQuestions.episodeGuid,
    episodeTitle: s.discipleshipEpisodeQuestions.episodeTitle, body: s.discipleshipEpisodeQuestions.body,
    reply: s.discipleshipEpisodeQuestions.reply, askerUnread: s.discipleshipEpisodeQuestions.askerUnread,
    createdAt: s.discipleshipEpisodeQuestions.createdAt,
  }).from(s.discipleshipEpisodeQuestions).where(eq(s.discipleshipEpisodeQuestions.askerEnrollmentId, enrollment.id))
    .orderBy(desc(s.discipleshipEpisodeQuestions.createdAt)).limit(50);
  return rows.map(row => ({ ...row, createdAt: new Date(row.createdAt).toISOString() }));
}

export async function markEpisodeQuestionsRead(userId: string) {
  const enrollment = await getSogpEnrollmentByUserId(userId);
  if (!enrollment) return;
  await db.update(s.discipleshipEpisodeQuestions).set({ askerUnread: false }).where(and(eq(s.discipleshipEpisodeQuestions.askerEnrollmentId, enrollment.id), eq(s.discipleshipEpisodeQuestions.askerUnread, true)));
}
