"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { CommunityError } from "@/lib/community/errors";
import {
  addNaturalAssignmentGoal, addNaturalAssignmentTodo, removeNaturalAssignmentGoal, removeNaturalAssignmentTodo,
  saveNaturalAssignmentOutcomes, setNaturalAssignmentTodoDone, type NaturalAssignmentDay,
} from "@/lib/db/queries/natural-assignment";

type Result = { ok: true; day: NaturalAssignmentDay } | { ok: false; error: string };

/** Each change returns the saved day, so the page replaces its optimistic copy with the truth. */
async function run(change: (userId: string) => Promise<NaturalAssignmentDay>): Promise<Result> {
  try {
    const session = await getAppSession();
    if (!session) throw new CommunityError("Sign in to save your natural assignment.");
    const day = await change(session.user.id);
    revalidatePath("/dashboard/community/report", "layout");
    return { ok: true, day };
  } catch (error) {
    if (error instanceof CommunityError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function addGoalAction(date: string, title: string) { return run(userId => addNaturalAssignmentGoal(userId, { date, title })); }
export async function removeGoalAction(goalId: number) { return run(userId => removeNaturalAssignmentGoal(userId, goalId)); }
export async function addTodoAction(goalId: number, text: string, deadline: string | null) { return run(userId => addNaturalAssignmentTodo(userId, { goalId, text, deadline })); }
export async function setTodoDoneAction(todoId: number, done: boolean) { return run(userId => setNaturalAssignmentTodoDone(userId, todoId, done)); }
export async function removeTodoAction(todoId: number) { return run(userId => removeNaturalAssignmentTodo(userId, todoId)); }
export async function saveOutcomesAction(date: string, outcomes: Array<{ goalId: number; outcome: string }>) { return run(userId => saveNaturalAssignmentOutcomes(userId, { date, outcomes })); }
