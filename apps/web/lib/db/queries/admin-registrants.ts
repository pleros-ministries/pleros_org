import {
  buildAdminRegistrantSummaries,
  type AdminRegistrantSummary,
} from "@/lib/admin-registrants";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

import { getStudentList } from "./students";

export async function getAdminRegistrantList(): Promise<AdminRegistrantSummary[]> {
  const [students, leads, prayerWatchRows, podcastRows] = await Promise.all([
    getStudentList({ limit: 5000 }),
    db.query.welcomePackLeads.findMany(),
    db
      .select({
        userId: schema.prayerWatchAttendance.userId,
        attendedDate: schema.prayerWatchAttendance.attendedDate,
      })
      .from(schema.prayerWatchAttendance),
    db
      .select({
        userId: schema.podcastEpisodeProgress.userId,
        listenedAt: schema.podcastEpisodeProgress.listenedAt,
      })
      .from(schema.podcastEpisodeProgress),
  ]);

  return buildAdminRegistrantSummaries({
    users: students.filter(Boolean).map((student) => ({
      id: student!.id,
      name: student!.name,
      email: student!.email,
      createdAt: student!.createdAt,
      currentLevel: student!.currentLevel,
      progressPercent: student!.progressPercent,
      currentLesson: student!.currentLesson,
      graduationStatus: student!.graduationStatus,
    })),
    leads: leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    })),
    prayerWatchRows,
    podcastRows,
  });
}

export async function getWelcomeOnlyRegistrantByRouteId(routeId: string) {
  const match = routeId.match(/^welcome-lead-(\d+)$/);
  if (!match) {
    return null;
  }

  const leadId = Number(match[1]);
  if (!Number.isInteger(leadId)) {
    return null;
  }

  return (
    (await db.query.welcomePackLeads.findFirst({
      where: (lead, { eq: eq2 }) => eq2(lead.id, leadId),
    })) ?? null
  );
}
