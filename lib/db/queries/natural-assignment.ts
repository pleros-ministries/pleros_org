import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { CommunityError } from "@/lib/community/errors";
import { reportableDateKeys } from "@/lib/community/ministry-report";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { lagosToday } from "@/lib/sogp/daily-date";

/**
 * Natural assignment (Pastor, 20 October): an optional report under "Other
 * reports" on My reports, never part of the daily report. A day has goals,
 * each with to-dos and an optional deadline, ticked through the day, and what
 * happened against each goal at the end of it (migration 0073). The person's
 * overseer reads it beside their daily report.
 */

export const NATURAL_ASSIGNMENT_GOALS_MAX = 10;
export const NATURAL_ASSIGNMENT_TODOS_MAX = 15;

export type NaturalAssignmentTodo = { id: number; text: string; deadline: string | null; done: boolean };
export type NaturalAssignmentGoal = { id: number; title: string; outcome: string; todos: NaturalAssignmentTodo[] };
export type NaturalAssignmentDay = { date: string; goals: NaturalAssignmentGoal[] };

const missingTable = (error: unknown) => String((error as { cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code) === "42P01";
const unavailable = () => new CommunityError("Natural assignment isn’t ready yet. Try again later.");

/** One day's goals and to-dos, or null before migration 0073 is applied. */
export async function getNaturalAssignment(userId: string, date: string): Promise<NaturalAssignmentDay | null> {
  try {
    const goals = await db.select({ id: s.naturalAssignmentGoals.id, title: s.naturalAssignmentGoals.title, outcome: s.naturalAssignmentGoals.outcome })
      .from(s.naturalAssignmentGoals)
      .where(and(eq(s.naturalAssignmentGoals.userId, userId), eq(s.naturalAssignmentGoals.reportDate, date)))
      .orderBy(asc(s.naturalAssignmentGoals.position), asc(s.naturalAssignmentGoals.id));
    const todos = goals.length ? await db.select({ id: s.naturalAssignmentTodos.id, goalId: s.naturalAssignmentTodos.goalId, text: s.naturalAssignmentTodos.text, deadline: s.naturalAssignmentTodos.deadline, doneAt: s.naturalAssignmentTodos.doneAt })
      .from(s.naturalAssignmentTodos).where(inArray(s.naturalAssignmentTodos.goalId, goals.map(goal => goal.id)))
      .orderBy(asc(s.naturalAssignmentTodos.position), asc(s.naturalAssignmentTodos.id)) : [];
    return {
      date,
      goals: goals.map(goal => ({
        id: goal.id, title: goal.title, outcome: goal.outcome ?? "",
        todos: todos.filter(todo => todo.goalId === goal.id).map(todo => ({ id: todo.id, text: todo.text, deadline: todo.deadline ? todo.deadline.slice(0, 5) : null, done: Boolean(todo.doneAt) })),
      })),
    };
  } catch (error) {
    if (missingTable(error)) return null;
    throw error;
  }
}

/** The counts for My reports' Other reports card; undefined hides the card. */
export async function getNaturalAssignmentSummary(userId: string, date: string) {
  try {
    const [row] = await db.select({
      goals: sql<number>`count(distinct ${s.naturalAssignmentGoals.id})::int`,
      todos: sql<number>`count(${s.naturalAssignmentTodos.id})::int`,
      done: sql<number>`count(${s.naturalAssignmentTodos.doneAt})::int`,
    }).from(s.naturalAssignmentGoals)
      .leftJoin(s.naturalAssignmentTodos, eq(s.naturalAssignmentTodos.goalId, s.naturalAssignmentGoals.id))
      .where(and(eq(s.naturalAssignmentGoals.userId, userId), eq(s.naturalAssignmentGoals.reportDate, date)));
    return { goals: row?.goals ?? 0, todos: row?.todos ?? 0, done: row?.done ?? 0 };
  } catch (error) {
    if (missingTable(error)) return undefined;
    throw error;
  }
}

function requireWritableDate(date: string) {
  if (!reportableDateKeys(lagosToday()).includes(date)) throw new CommunityError("You can change this for today and the past 7 days.");
}

const clean = (value: string, max: number, what: string) => {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) throw new CommunityError(`Write the ${what} first.`);
  if (text.length > max) throw new CommunityError(`Keep the ${what} under ${max} characters.`);
  return text;
};

async function ownGoal(userId: string, goalId: number) {
  const [goal] = await db.select({ id: s.naturalAssignmentGoals.id, date: s.naturalAssignmentGoals.reportDate })
    .from(s.naturalAssignmentGoals).where(and(eq(s.naturalAssignmentGoals.id, goalId), eq(s.naturalAssignmentGoals.userId, userId))).limit(1);
  if (!goal) throw new CommunityError("That goal isn’t there any more.");
  requireWritableDate(goal.date);
  return goal;
}

async function ownTodo(userId: string, todoId: number) {
  const [todo] = await db.select({ id: s.naturalAssignmentTodos.id, date: s.naturalAssignmentGoals.reportDate })
    .from(s.naturalAssignmentTodos).innerJoin(s.naturalAssignmentGoals, eq(s.naturalAssignmentGoals.id, s.naturalAssignmentTodos.goalId))
    .where(and(eq(s.naturalAssignmentTodos.id, todoId), eq(s.naturalAssignmentGoals.userId, userId))).limit(1);
  if (!todo) throw new CommunityError("That to-do isn’t there any more.");
  requireWritableDate(todo.date);
  return todo;
}

/** Every write: unavailable before migration 0073, then the fresh day back for the page. */
async function write(userId: string, date: () => Promise<string> | string, change: () => Promise<unknown>) {
  try {
    const day = await date();
    await change();
    return (await getNaturalAssignment(userId, day))!;
  } catch (error) {
    if (missingTable(error)) throw unavailable();
    throw error;
  }
}

export function addNaturalAssignmentGoal(userId: string, input: { date: string; title: string }) {
  return write(userId, () => input.date, async () => {
    requireWritableDate(input.date);
    const title = clean(input.title, 200, "goal");
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.naturalAssignmentGoals)
      .where(and(eq(s.naturalAssignmentGoals.userId, userId), eq(s.naturalAssignmentGoals.reportDate, input.date)));
    if (n >= NATURAL_ASSIGNMENT_GOALS_MAX) throw new CommunityError(`A day holds up to ${NATURAL_ASSIGNMENT_GOALS_MAX} goals.`);
    await db.insert(s.naturalAssignmentGoals).values({ userId, reportDate: input.date, title, position: n });
  });
}

export function removeNaturalAssignmentGoal(userId: string, goalId: number) {
  return write(userId, async () => (await ownGoal(userId, goalId)).date, () =>
    db.delete(s.naturalAssignmentGoals).where(and(eq(s.naturalAssignmentGoals.id, goalId), eq(s.naturalAssignmentGoals.userId, userId))));
}

export function addNaturalAssignmentTodo(userId: string, input: { goalId: number; text: string; deadline: string | null }) {
  return write(userId, async () => (await ownGoal(userId, input.goalId)).date, async () => {
    const text = clean(input.text, 200, "to-do");
    const deadline = input.deadline && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.deadline) ? input.deadline : null;
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.naturalAssignmentTodos).where(eq(s.naturalAssignmentTodos.goalId, input.goalId));
    if (n >= NATURAL_ASSIGNMENT_TODOS_MAX) throw new CommunityError(`A goal holds up to ${NATURAL_ASSIGNMENT_TODOS_MAX} to-dos.`);
    await db.insert(s.naturalAssignmentTodos).values({ goalId: input.goalId, text, deadline, position: n });
  });
}

export function setNaturalAssignmentTodoDone(userId: string, todoId: number, done: boolean) {
  return write(userId, async () => (await ownTodo(userId, todoId)).date, () =>
    db.update(s.naturalAssignmentTodos).set({ doneAt: done ? sql`coalesce(${s.naturalAssignmentTodos.doneAt}, now())` : null }).where(eq(s.naturalAssignmentTodos.id, todoId)));
}

export function removeNaturalAssignmentTodo(userId: string, todoId: number) {
  return write(userId, async () => (await ownTodo(userId, todoId)).date, () =>
    db.delete(s.naturalAssignmentTodos).where(eq(s.naturalAssignmentTodos.id, todoId)));
}

/** End of day: what happened against each goal. An empty answer clears it. */
export function saveNaturalAssignmentOutcomes(userId: string, input: { date: string; outcomes: Array<{ goalId: number; outcome: string }> }) {
  return write(userId, () => input.date, async () => {
    requireWritableDate(input.date);
    for (const entry of input.outcomes.slice(0, NATURAL_ASSIGNMENT_GOALS_MAX)) {
      const outcome = entry.outcome.trim();
      if (outcome.length > 1000) throw new CommunityError("Keep each answer under 1,000 characters.");
      await db.update(s.naturalAssignmentGoals).set({ outcome: outcome || null, updatedAt: sql`now()` })
        .where(and(eq(s.naturalAssignmentGoals.id, entry.goalId), eq(s.naturalAssignmentGoals.userId, userId), eq(s.naturalAssignmentGoals.reportDate, input.date)));
    }
  });
}
