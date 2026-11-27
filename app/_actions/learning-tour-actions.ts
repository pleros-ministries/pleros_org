"use server";
import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { saveLearningTour } from "@/lib/db/queries/learning-tour";

/** Saves the guided tour's progress for the signed-in learner (user, 24 November). */
export async function saveLearningTourAction(input: unknown) {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false as const, error: "Sign in to continue the tour." };
  try {
    return { ok: true as const, value: await saveLearningTour(session.user.id, input) };
  } catch {
    return { ok: false as const, error: "Couldn’t save your place in the tour." };
  }
}
