"use server";

import { requireAdmin } from "@/lib/auth/require-role";
import { getSogpDailyParticipation } from "@/lib/db/queries/sogp-daily";
import { DAILY_DATE_PATTERN, type DailyParticipationRow } from "@/lib/sogp/daily-participation";
import {
  getSogpLessonRoster,
  getSogpLiveClassRoster,
  getSogpPrayerWatchRoster,
} from "@/lib/db/queries/sogp-roster";

export type AdminSogpLessonRosterEntry = {
  enrollmentId: number;
  name: string;
  email: string;
  status: string;
  audioListened: boolean;
  notesRead: boolean;
  quizPassed: boolean;
  highestQuizScore: number | null;
  writtenApproved: boolean;
};

export async function getAdminSogpLessonRoster(
  cohortId: number,
  lessonId: number,
  pastorId?: string,
): Promise<AdminSogpLessonRosterEntry[]> {
  await requireAdmin();
  const roster = await getSogpLessonRoster(cohortId, lessonId, pastorId);
  return roster.map((entry) => ({
    enrollmentId: entry.enrollmentId,
    name: entry.name,
    email: entry.email,
    status: entry.status,
    audioListened: entry.audioListened,
    notesRead: entry.notesRead,
    quizPassed: entry.quizPassed,
    highestQuizScore: entry.highestQuizScore,
    writtenApproved: entry.writtenApproved,
  }));
}

export type AdminSogpPrayerWatchRosterEntry = {
  enrollmentId: number;
  name: string;
  email: string;
  status: string;
  attended: boolean;
};

export async function getAdminSogpPrayerWatchRoster(
  cohortId: number,
  date: string,
  pastorId?: string,
): Promise<AdminSogpPrayerWatchRosterEntry[]> {
  await requireAdmin();
  return getSogpPrayerWatchRoster(cohortId, date, pastorId);
}

export type AdminSogpLiveClassRosterEntry = {
  enrollmentId: number;
  name: string;
  email: string;
  status: string;
  attended: boolean;
  attendedAt: string | null;
  completionSource: "live" | "recording" | null;
};

export async function getAdminSogpLiveClassRoster(
  cohortId: number,
  liveClassId: number,
  pastorId?: string,
): Promise<AdminSogpLiveClassRosterEntry[]> {
  await requireAdmin();
  const roster = await getSogpLiveClassRoster(cohortId, liveClassId, pastorId);
  return roster.map((entry) => ({
    enrollmentId: entry.enrollmentId,
    name: entry.name,
    email: entry.email,
    status: entry.status,
    attended: entry.attended,
    attendedAt: entry.attendedAt ? entry.attendedAt.toISOString() : null,
    completionSource: entry.completionSource,
  }));
}

export async function getAdminSogpDailyParticipation(
  cohortId: number,
  dateKey: string,
): Promise<DailyParticipationRow[]> {
  await requireAdmin();
  if (!DAILY_DATE_PATTERN.test(dateKey)) throw new Error("Invalid date");
  return getSogpDailyParticipation(cohortId, dateKey);
}
