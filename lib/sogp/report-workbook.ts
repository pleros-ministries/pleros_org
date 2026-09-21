import * as XLSX from "xlsx";

import { SOGP_TOTAL_WEEKS } from "./calendar";

import type { AdminSogpReportData } from "@/lib/admin-query";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function selectCohorts(report: AdminSogpReportData, cohortId: number | null) {
  return cohortId ? report.cohorts.filter((cohort) => cohort.id === cohortId) : report.cohorts;
}

export function buildSogpReportWorkbook(report: AdminSogpReportData, cohortId: number | null = null): Buffer {
  const cohorts = selectCohorts(report, cohortId);
  const cohortIds = new Set(cohorts.map((cohort) => cohort.id));
  const leftBehind = report.leftBehind.filter((entry) => cohortIds.has(entry.cohortId));

  const summarySheet = XLSX.utils.json_to_sheet(
    cohorts.map((cohort) => ({
      Cohort: cohort.title,
      Status: cohort.status,
      "Starts": formatDate(cohort.startsAt),
      "Ends": formatDate(cohort.endsAt),
      "Total enrollments": cohort.totalEnrollments,
      "Enrolled": cohort.statusBreakdown.enrolled ?? 0,
      "Preparing": cohort.statusBreakdown.preparing ?? 0,
      "Active": cohort.statusBreakdown.active ?? 0,
      "Carryover": cohort.statusBreakdown.carryover ?? 0,
      "Completed": cohort.statusBreakdown.completed ?? 0,
      "Withdrawn": cohort.statusBreakdown.withdrawn ?? 0,
      "Average completion %": Math.round(cohort.averageCompletionPercent * 10) / 10,
      "Prep-phase completion rate %": Math.round(cohort.prepPhaseCompletionRate * 10) / 10,
      "Live class attendance rate %": Math.round(cohort.liveClassAttendanceRate * 10) / 10,
      "Prayer watch participation rate %": Math.round(cohort.prayerWatchParticipationRate * 10) / 10,
      "Certificates issued": cohort.certificatesIssued,
    })),
  );

  const weeklyRows = cohorts.flatMap((cohort) =>
    cohort.weeklyParticipation.map((week) => ({
      Cohort: cohort.title,
      Week: week.week,
      "Week starts": formatDate(week.startsAt),
      "Week ends": formatDate(week.endsAt),
      "Active enrollments": week.activeEnrollments,
      "Completed >=1 required track": week.completedAtLeastOneRequiredTrack,
      "Completed all required tracks": week.completedAllRequiredTracksForWeek,
      "Track completion %": Math.round(week.trackCompletionPercent * 10) / 10,
      "Live class attendance": week.liveClassAttendance,
      "Live class attendance %": Math.round(week.liveClassAttendancePercent * 10) / 10,
      "Prayer watch distinct days": week.prayerWatchDistinctDays,
      "Prayer watch participation %": Math.round(week.prayerWatchParticipationPercent * 10) / 10,
    })),
  );
  const weeklySheet = XLSX.utils.json_to_sheet(weeklyRows);

  const participants = report.participants.filter((participant) => cohortIds.has(participant.cohortId));
  const participantSheet = XLSX.utils.json_to_sheet(
    participants.map((participant) => {
      const weekColumns = Object.fromEntries(
        participant.weeklyTrackCompletion.map(({ week, completed, total }) => [
          `Week ${week} tracks`,
          `${completed}/${total}`,
        ]),
      );
      return {
        Name: participant.name,
        Email: participant.email,
        Cohort: participant.cohortTitle,
        Pastor: participant.pastorName ?? "Unassigned",
        Status: participant.status,
        ...weekColumns,
        "Live classes attended": `${participant.liveClassesAttended}/${participant.liveClassesRequired}`,
        "Prayer watch days": participant.prayerWatchDays,
        "Completion %": Math.round(participant.completionPercent * 10) / 10,
      };
    }),
  );

  const leftBehindSheet = XLSX.utils.json_to_sheet(
    leftBehind.map((entry) => ({
      Name: entry.name,
      Email: entry.email,
      Cohort: entry.cohortTitle,
      Pastor: entry.pastorName ?? "Unassigned",
      "Current week": entry.currentWeek ?? `Cohort ended (week ${SOGP_TOTAL_WEEKS} expected)`,
      "Expected tracks": entry.expectedTrackCount,
      "Completed tracks": entry.completedTrackCount,
      "Completion %": Math.round(entry.completionPercent * 10) / 10,
      "Last activity": formatDate(entry.lastActivityAt),
      "Days since last activity": entry.daysSinceLastActivity ?? "Never active",
      "Behind pace": entry.flags.includes("behind_pace") ? "Y" : "N",
      "Inactive 7+ days": entry.flags.includes("inactive_7_days") ? "Y" : "N",
    })),
  );

  const cohortTitleById = new Map(report.cohorts.map((cohort) => [cohort.id, cohort.title]));
  const pastorSheet = XLSX.utils.json_to_sheet(
    report.pastorBreakdown
      .filter((row) => cohortIds.has(row.cohortId))
      .map((row) => ({
        Cohort: cohortTitleById.get(row.cohortId) ?? "",
        Pastor: row.pastorName,
        Enrollees: row.enrollees,
        "Average completion %": Math.round(row.averageCompletionPercent * 10) / 10,
        "Live class attendance %": Math.round(row.liveClassAttendanceRate * 10) / 10,
        "Prayer watch %": Math.round(row.prayerWatchParticipationRate * 10) / 10,
        "Left behind": row.leftBehindCount,
        "Contact attempted (enrollees)": row.pastorId ? row.contactedCount : "n/a",
        "Never contact-attempted": row.pastorId ? row.neverContactedCount : "n/a",
        "Last contact attempt": formatDate(row.lastContactAttemptAt),
      })),
  );

  const signupSheet = XLSX.utils.json_to_sheet(
    cohorts.flatMap((cohort) =>
      cohort.signupTrend.map((point) => ({
        Cohort: cohort.title,
        "Week starting (Mon)": point.weekStart,
        "New sign-ups": point.signups,
        "Cumulative sign-ups": point.cumulative,
      })),
    ),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Cohort summary");
  XLSX.utils.book_append_sheet(workbook, weeklySheet, "Weekly participation");
  XLSX.utils.book_append_sheet(workbook, participantSheet, "Participant weekly matrix");
  XLSX.utils.book_append_sheet(workbook, leftBehindSheet, "Left behind");
  XLSX.utils.book_append_sheet(workbook, pastorSheet, "By pastor");
  XLSX.utils.book_append_sheet(workbook, signupSheet, "Sign-up growth");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
