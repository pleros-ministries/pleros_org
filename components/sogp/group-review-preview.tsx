"use client";
import { GroupReviewList } from "./group-review-list";
import { GroupReviewSchedule } from "./group-review-schedule";
import type { GroupReviewView } from "@/lib/db/queries/sogp-group-reviews";

const group = { id: 1, name: "Tolu’s discipleship group", leaderName: "Tolu Adeyemi", joinedAt: "2026-09-01T09:00:00Z", isLeader: false };
const review = (id: number, title: string, startsAt: string, attendance: "attended" | "missed" | null, makeUpCompleted = false) => ({ id, groupId: 1, groupName: group.name, title, venue: "Yaba fellowship hall", startsAt, endsAt: new Date(new Date(startsAt).getTime() + 3600_000).toISOString(), leaderName: "Tolu", attendance, makeUpCompleted, canConfirm: false });

/** Synthetic adapter: no DB, auth or saved actions. */
export function GroupReviewPreview({ screen }: { screen: string }) {
  if (screen === "schedule") return <GroupReviewSchedule groups={[{ id: 1, name: group.name, leaderName: "Tolu Adeyemi" }]} schedule={async () => ({ ok: false, error: "Preview only. Nothing is saved." })} />;
  const data = { groups: [group], group, now: new Date("2026-10-14T12:00:00Z").getTime(), reviews: [
    review(3, "Week 3 · Walking in love", "2026-10-17T16:00:00Z", null),
    review(2, "Week 2 · The life of faith", "2026-10-10T16:00:00Z", "missed"),
    review(1, "Week 1 · God’s purpose", "2026-10-03T16:00:00Z", "attended"),
  ] } as unknown as GroupReviewView;
  return <GroupReviewList data={data} />;
}
