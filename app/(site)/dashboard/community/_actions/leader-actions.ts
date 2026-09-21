"use server";

import { after } from "next/server";

import { getCommunityContext } from "@/lib/community/context";
import { notifyLeaderNudge } from "@/lib/community/notify";
import { getLeaderReport } from "@/lib/db/queries/community-reports";
import { markNotificationsRead } from "@/lib/db/queries/community-notifications";

export async function nudgeAtRiskMembers(input: {
  unitId: number;
  message: string;
}) {
  const ctx = await getCommunityContext();
  const allowed =
    ctx &&
    (ctx.isAdmin || (ctx.isUnitLeader && ctx.unit?.id === input.unitId));
  if (!allowed) throw new Error("Forbidden");

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
