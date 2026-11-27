import "server-only";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { tourInput, type TourMode, type TourPath, type TourStatus } from "@/lib/sogp/learning-tour";

import { getHomeDiscipleshipSummary } from "./sogp-discipleship";

export type LearningTourStart = {
  /** Null when the tour shouldn't start by itself; Profile can still replay it. */
  resume: { step: string | null; path: TourPath | null; mode: TourMode | null } | null;
  firstName: string;
  leaderFirstName: string | null;
};

/**
 * Whether the guided tour runs for this person (user, 24 November). It starts
 * once for an enrolled learner who hasn't chosen a path yet, resumes while
 * active, and never shows again once done or skipped. Learners who chose a
 * path before the tour existed don't get it unless they replay it.
 */
export async function getLearningTourStart(userId: string, name: string): Promise<LearningTourStart> {
  const [[row], [preference], group] = await Promise.all([
    db.select().from(s.learningTourProgress).where(eq(s.learningTourProgress.userId, userId)).limit(1),
    db.select({ userId: s.sogpLearningPreferences.userId }).from(s.sogpLearningPreferences).where(eq(s.sogpLearningPreferences.userId, userId)).limit(1),
    getHomeDiscipleshipSummary(userId).catch(() => ({ kind: "none" as const })),
  ]);
  const firstName = name.trim().split(/\s+/)[0] || "there";
  const leaderFirstName = group.kind === "member" ? group.leaderFirstName : null;
  const resume = row ? (row.status === "active" ? { step: row.step, path: row.path, mode: row.planMode } : null)
    : preference ? null : { step: null, path: null, mode: null };
  return { resume, firstName, leaderFirstName };
}

/** Saves where the learner is, or that they finished or skipped. Owner only. */
export async function saveLearningTour(userId: string, value: unknown) {
  const input = tourInput(value);
  const finished = input.status !== "active";
  await db.insert(s.learningTourProgress).values({ userId, status: input.status, step: input.step, path: input.path, planMode: input.mode, finishedAt: finished ? sql`now()` : null })
    .onConflictDoUpdate({ target: s.learningTourProgress.userId, set: { status: input.status, step: input.step, path: input.path, planMode: input.mode, updatedAt: sql`now()`, finishedAt: finished ? sql`now()` : null } });
  return { status: input.status satisfies TourStatus };
}
