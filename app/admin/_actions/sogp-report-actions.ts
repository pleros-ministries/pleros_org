"use server";

import { requireAdmin } from "@/lib/auth/require-role";
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
): Promise<AdminSogpLessonRosterEntry[]> {
  await requireAdmin();
  const roster = await getSogpLessonRoster(cohortId, lessonId);
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
): Promise<AdminSogpPrayerWatchRosterEntry[]> {
  await requireAdmin();
  return getSogpPrayerWatchRoster(cohortId, date);
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
): Promise<AdminSogpLiveClassRosterEntry[]> {
  await requireAdmin();
  const roster = await getSogpLiveClassRoster(cohortId, liveClassId);
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
