import { gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";

export type DashboardVisitAnalytics = {
  allTimeVisits: number;
  visitsLast7Days: number;
  uniqueVisitorsLast7Days: number;
};

export type SuperAdminOverviewMetrics = {
  dashboardVisits: DashboardVisitAnalytics;
  newUsers: {
    distinctPeopleLast7Days: number;
    ppcAccountsLast7Days: number;
    welcomeLeadsLast7Days: number;
  };
  devotion: {
    participantsLast30Days: number;
    prayerWatchParticipantsLast30Days: number;
    bibleReadingParticipantsLast30Days: number;
    podcastParticipantsLast30Days: number;
  };
};

type DashboardVisitorType = "user" | "welcome";

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number, now = new Date()) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isMissingDashboardVisitTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown; message?: unknown };

  return (
    maybeError.code === "42P01" ||
    (typeof maybeError.message === "string" &&
      maybeError.message.includes("dashboard_visit_summaries"))
  );
}

export async function recordDashboardVisit({
  visitorKey,
  visitorType,
}: {
  visitorKey: string;
  visitorType: DashboardVisitorType;
}) {
  const normalizedVisitorKey = visitorKey.trim().toLowerCase();

  if (!normalizedVisitorKey) {
    return;
  }

  const now = new Date();

  try {
    await db
      .insert(schema.dashboardVisitSummaries)
      .values({
        visitorKey: normalizedVisitorKey,
        visitorType,
        visitedDate: toDateKey(now),
        visitCount: 1,
        lastVisitedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          schema.dashboardVisitSummaries.visitorKey,
          schema.dashboardVisitSummaries.visitedDate,
        ],
        set: {
          visitCount: sql`${schema.dashboardVisitSummaries.visitCount} + 1`,
          visitorType,
          lastVisitedAt: now,
          updatedAt: now,
        },
      });
  } catch (error) {
    if (!isMissingDashboardVisitTableError(error)) {
      throw error;
    }
  }
}

async function getDashboardVisitAnalytics(): Promise<DashboardVisitAnalytics> {
  const sevenDaysAgo = toDateKey(daysAgo(6));

  try {
    const [[allTime], [recent]] = await Promise.all([
      db
        .select({
          visits: sql<number>`coalesce(sum(${schema.dashboardVisitSummaries.visitCount}), 0)::int`,
        })
        .from(schema.dashboardVisitSummaries),
      db
        .select({
          visits: sql<number>`coalesce(sum(${schema.dashboardVisitSummaries.visitCount}), 0)::int`,
          uniqueVisitors: sql<number>`count(distinct ${schema.dashboardVisitSummaries.visitorKey})::int`,
        })
        .from(schema.dashboardVisitSummaries)
        .where(gte(schema.dashboardVisitSummaries.visitedDate, sevenDaysAgo)),
    ]);

    return {
      allTimeVisits: normalizeNumber(allTime?.visits),
      visitsLast7Days: normalizeNumber(recent?.visits),
      uniqueVisitorsLast7Days: normalizeNumber(recent?.uniqueVisitors),
    };
  } catch (error) {
    if (!isMissingDashboardVisitTableError(error)) {
      throw error;
    }

    return {
      allTimeVisits: 0,
      visitsLast7Days: 0,
      uniqueVisitorsLast7Days: 0,
    };
  }
}

export async function getSuperAdminOverviewMetrics(): Promise<SuperAdminOverviewMetrics> {
  const sevenDaysAgo = daysAgo(6);
  const thirtyDaysAgoDateKey = toDateKey(daysAgo(29));
  const thirtyDaysAgo = daysAgo(29);

  const [
    dashboardVisits,
    newPpcUsers,
    newWelcomeLeads,
    prayerRows,
    bibleRows,
    podcastRows,
  ] = await Promise.all([
    getDashboardVisitAnalytics(),
    db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(gte(schema.users.createdAt, sevenDaysAgo)),
    db
      .select({ email: schema.welcomePackLeads.email })
      .from(schema.welcomePackLeads)
      .where(gte(schema.welcomePackLeads.createdAt, sevenDaysAgo)),
    db
      .select({ userId: schema.prayerWatchAttendance.userId })
      .from(schema.prayerWatchAttendance)
      .where(
        gte(schema.prayerWatchAttendance.attendedDate, thirtyDaysAgoDateKey),
      ),
    db
      .select({ userId: schema.bibleReadingLogs.userId })
      .from(schema.bibleReadingLogs)
      .where(gte(schema.bibleReadingLogs.readingDate, thirtyDaysAgoDateKey)),
    db
      .select({ userId: schema.podcastEpisodeProgress.userId })
      .from(schema.podcastEpisodeProgress)
      .where(gte(schema.podcastEpisodeProgress.listenedAt, thirtyDaysAgo)),
  ]);

  const newPeople = new Set(
    [...newPpcUsers, ...newWelcomeLeads].map((row) =>
      row.email.trim().toLowerCase(),
    ),
  );
  const prayerParticipants = new Set(prayerRows.map((row) => row.userId));
  const bibleParticipants = new Set(bibleRows.map((row) => row.userId));
  const podcastParticipants = new Set(podcastRows.map((row) => row.userId));
  const devotionParticipants = new Set([
    ...prayerParticipants,
    ...bibleParticipants,
    ...podcastParticipants,
  ]);

  return {
    dashboardVisits,
    newUsers: {
      distinctPeopleLast7Days: newPeople.size,
      ppcAccountsLast7Days: newPpcUsers.length,
      welcomeLeadsLast7Days: newWelcomeLeads.length,
    },
    devotion: {
      participantsLast30Days: devotionParticipants.size,
      prayerWatchParticipantsLast30Days: prayerParticipants.size,
      bibleReadingParticipantsLast30Days: bibleParticipants.size,
      podcastParticipantsLast30Days: podcastParticipants.size,
    },
  };
}
