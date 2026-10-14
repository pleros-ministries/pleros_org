"use server";
import { revalidatePath } from "next/cache";
import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { CommunityError } from "@/lib/community/errors";
import { chooseOwnSogpPath, editOwnSogpPlan, saveOwnSogpPlayback } from "@/lib/db/queries/sogp-learning";

async function ownLearningAction<T>(input: unknown, operation: (userId: string, value: unknown) => Promise<T>) {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false as const,error: "Sign in to change your learning settings." };
  try {
    const value = await operation(session.user.id,input);
    revalidatePath("/dashboard/sogp"); revalidatePath("/dashboard/podcast"); revalidatePath("/dashboard");
    return { ok: true as const,value };
  } catch (error) {
    return { ok: false as const,error: error instanceof CommunityError ? error.message : "Your learning settings could not be saved. Try again." };
  }
}
export async function chooseSogpPathAction(input: unknown) { return ownLearningAction(input,chooseOwnSogpPath); }
export async function editSogpPlanAction(input: unknown) { return ownLearningAction(input,editOwnSogpPlan); }
export async function saveSogpPlaybackAction(input: unknown) { return ownLearningAction(input,saveOwnSogpPlayback); }
