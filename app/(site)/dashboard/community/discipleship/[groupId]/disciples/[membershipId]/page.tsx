import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DiscipleDetail, type DiscipleWeekDay } from "@/components/community/discipleship/disciple-detail";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { getAppSession } from "@/lib/app-session";
import { getDiscipleDailyParticipation, getDiscipleshipDashboard } from "@/lib/db/queries/sogp-discipleship";
import { getDiscipleWork } from "@/lib/db/queries/discipleship-work";
import { getLeaderEpisodeQuestions } from "@/lib/db/queries/sogp-episode-questions";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Disciple" };

const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

/** One disciple of a group the viewer leads, opened from that group's page. */
export default async function DiscipleRoute({ params }: { params: Promise<{ groupId: string; membershipId: string }> }) {
  const { groupId: rawGroup, membershipId: rawMember } = await params;
  if (!/^\d{1,9}$/.test(rawGroup) || !/^\d{1,9}$/.test(rawMember)) notFound();
  const groupId = Number(rawGroup);
  const membershipId = Number(rawMember);

  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/discipleship/${groupId}/disciples/${membershipId}`);

  // Ownership: the query falls back to the leader's first group for an id
  // that isn't theirs, and the disciple must be a current member of this one.
  const data = await getDiscipleshipDashboard(session.user.id, groupId);
  if (!data || data.selectedGroup.id !== groupId) notFound();
  const group = data.selectedGroup;
  const disciple = group.disciples.find(item => item.membershipId === membershipId);
  if (!disciple) notFound();

  // The last seven Lagos days, bounded by the group's participation range.
  const today = lagosToday();
  const start = data.participationRange?.start ?? today;
  const dates = Array.from({ length: 7 }, (_, index) => shiftDate(today, index - 6));
  const [days, episodeQuestions, work] = await Promise.all([
    Promise.all(dates.map(date => date < start
      ? Promise.resolve(null)
      : getDiscipleDailyParticipation(data.viewer.enrollmentId, groupId, date).then(rows => rows.find(row => row.membershipId === membershipId) ?? null).catch(() => null))),
    getLeaderEpisodeQuestions(session.user.id, groupId).catch(() => []),
    getDiscipleWork(session.user.id, groupId, membershipId),
  ]);
  if (!work) notFound();
  const week: DiscipleWeekDay[] = dates.map((date, index) => {
    const day = days[index];
    const label = weekday.format(new Date(`${date}T12:00:00Z`));
    if (!day) return { date, label, state: "none" };
    const done = [day.prayerWatch, day.listened, day.quizAttempted, day.writtenSubmitted, day.reviewAttended].some(Boolean);
    return { date, label, state: done ? "done" : date === today ? "today" : "missed" };
  });

  return <SogpQueryProvider>
    <DiscipleDetail
      groupId={groupId}
      groupName={group.name}
      disciple={disciple}
      week={week}
      work={work}
      prompts={group.prompts}
      prayerRequests={group.prayerRequests}
      episodeQuestions={episodeQuestions.filter(question => question.askerEnrollmentId === disciple.enrollmentId)}
      paused={group.status === "archived"}
    />
  </SogpQueryProvider>;
}
