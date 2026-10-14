"use server";
import { revalidatePath } from "next/cache";
import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { CommunityError } from "@/lib/community/errors";
import { chooseOwnSogpPath, editOwnSogpPlan, saveOwnSogpPlayback, setOwnSogpListened } from "@/lib/db/queries/sogp-learning";

async function ownLearningAction<T>(input: unknown, operation: (userId: string, value: unknown) => Promise<T>, revalidate = true) {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false as const,error: "Sign in to change your learning settings." };
  try {
    const value = await operation(session.user.id,input);
    if (revalidate) {
      revalidatePath("/dashboard/sogp", "layout"); revalidatePath("/dashboard/podcast"); revalidatePath("/dashboard");
      revalidatePath("/dashboard/community/report"); revalidatePath("/dashboard/church");
    }
    return { ok: true as const,value };
  } catch (error) {
    return { ok: false as const,error: error instanceof CommunityError ? error.message : "Your learning settings could not be saved. Try again." };
  }
}
export async function chooseSogpPathAction(input: unknown) { return ownLearningAction(input,chooseOwnSogpPath); }
export async function editSogpPlanAction(input: unknown) { return ownLearningAction(input,editOwnSogpPlan); }
export async function saveSogpPlaybackAction(input: unknown) { return ownLearningAction(input,saveOwnSogpPlayback,false); }
export async function setSogpListenedAction(input: unknown) { return ownLearningAction(input,setOwnSogpListened); }
