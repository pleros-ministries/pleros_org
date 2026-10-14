"use server";
import { revalidatePath } from "next/cache";
import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { CommunityError } from "@/lib/community/errors";
import { confirmOwnGroupAttendance, scheduleOwnGroupReview } from "@/lib/db/queries/sogp-group-reviews";
import { offerOwnReviewMakeUp, chooseOwnReviewMakeUp, confirmOwnReviewMakeUp } from "@/lib/db/queries/sogp-review-makeups";

async function ownReviewAction(input: unknown, operation: (userId: string, input: unknown) => Promise<{ groupId: number }>) {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false as const, error: "Sign in to manage group reviews." };
  try { const result = await operation(session.user.id, input); revalidatePath("/dashboard/sogp/reviews", "layout"); revalidatePath("/dashboard/sogp/discipleship"); return { ok: true as const, ...result }; }
  catch (error) { return { ok: false as const, error: error instanceof CommunityError ? error.message : "This review could not be saved. Your details are still here; try again." }; }
}
export async function scheduleGroupReview(input: unknown) { return ownReviewAction(input, scheduleOwnGroupReview); }
export async function confirmGroupReviewAttendance(input: unknown) { return ownReviewAction(input, confirmOwnGroupAttendance); }
export async function offerReviewMakeup(input: unknown) { return ownReviewAction(input, offerOwnReviewMakeUp); }
export async function chooseReviewMakeup(offerId: unknown) { return ownReviewAction(offerId, chooseOwnReviewMakeUp); }
export async function confirmReviewMakeup(input: unknown) { return ownReviewAction(input, confirmOwnReviewMakeUp); }
