"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getCommunityContext } from "@/lib/community/context";
import { managesAnyUnit, managesUnit } from "@/lib/community/permissions";
import { notifyFlagResolved, notifyLeaderNudge } from "@/lib/community/notify";
import { setCommentStatus } from "@/lib/db/queries/community-comments";
import {
  listOpenFlags,
  resolveFlag,
  setPostStatus,
} from "@/lib/db/queries/community-posts";
import { getLeaderReport } from "@/lib/db/queries/community-reports";
import { markNotificationsRead } from "@/lib/db/queries/community-notifications";

export async function nudgeAtRiskMembers(input: {
  unitId: number;
  message: string;
}) {
  const ctx = await getCommunityContext();
  if (!ctx || !managesUnit(ctx, input.unitId)) throw new Error("Forbidden");

  const message = input.message.trim().slice(0, 500);
  if (!message) throw new Error("Write a short message first.");

  const report = await getLeaderReport(input.unitId);
  if (!report || report.atRisk.length === 0) return { nudged: 0 };

  const enrollmentIds = report.atRisk.map((m) => m.enrollmentId);
  after(() =>
    notifyLeaderNudge({
      enrollmentIds,
      unitName: report.unitName,
      message,
    }).catch((error) => console.error("Leader nudge failed:", error)),
  );
  return { nudged: enrollmentIds.length };
}

export async function markCommunityNotificationsRead() {
  const ctx = await getCommunityContext();
  if (!ctx) throw new Error("Forbidden");
  await markNotificationsRead(ctx.userId);
}

/**
 * A unit's manager (pastor or leader) or an admin actions a reported post or comment. The flag
 * must be one `listOpenFlags` already scopes to the caller; reported private
 * messages are handled by admins only.
 */
export async function resolveUnitFlag(input: {
  flagId: number;
  action: "hide" | "dismiss";
}) {
  const ctx = await getCommunityContext();
  if (!ctx || !managesAnyUnit(ctx)) throw new Error("Forbidden");

  const flag = (await listOpenFlags(ctx)).find((f) => f.id === input.flagId);
  if (!flag || flag.targetType === "message") throw new Error("Forbidden");

  if (input.action === "hide") {
    if (flag.targetType === "post") {
      await setPostStatus(flag.targetId, "hidden");
    } else {
      await setCommentStatus(flag.targetId, "hidden");
    }
  }

  const [row] = await db
    .select({ reporterId: schema.contentFlags.reporterId })
    .from(schema.contentFlags)
    .where(eq(schema.contentFlags.id, input.flagId))
    .limit(1);

  const status = input.action === "hide" ? "actioned" : "dismissed";
  await resolveFlag({ flagId: input.flagId, handledBy: ctx.userId, status });

  if (row) {
    after(() =>
      notifyFlagResolved({ reporterId: row.reporterId, outcome: status }).catch(
        (error) => console.error("Flag-resolved notification failed:", error),
      ),
    );
  }

  revalidatePath("/dashboard/community");
  revalidatePath("/dashboard/community/leader");
  revalidatePath("/admin/community");
}
