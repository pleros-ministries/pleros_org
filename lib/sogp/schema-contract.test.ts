import { describe, expect, test } from "vitest";

import {
  sogpCertificates,
  sogpCohorts,
  sogpCohortTracks,
  sogpEnrollments,
  sogpLiveClassAttendance,
  sogpLiveClasses,
  sogpPreparationDays,
  sogpPreparationResources,
  sogpRewardGrants,
  prayerWatchAttendance,
} from "../db/schema";

describe("SOGP schema", () => {
  test("exports the complete cohort lifecycle tables", () => {
    expect(sogpCohorts).toBeDefined();
    expect(sogpEnrollments).toBeDefined();
    expect(sogpCohortTracks).toBeDefined();
    expect(sogpLiveClasses).toBeDefined();
    expect(sogpLiveClassAttendance).toBeDefined();
    expect(sogpPreparationDays).toBeDefined();
    expect(sogpPreparationResources).toBeDefined();
    expect(sogpCertificates).toBeDefined();
    expect(sogpRewardGrants).toBeDefined();
  });

  test("stores structured enrolment and curriculum metadata", () => {
    expect(sogpEnrollments.firstName).toBeDefined();
    expect(sogpEnrollments.lastName).toBeDefined();
    expect(sogpEnrollments.countryCode).toBeDefined();
    expect(sogpEnrollments.region).toBeDefined();
    expect(sogpEnrollments.referralSource).toBeDefined();
    expect(sogpEnrollments.referralCode).toBeDefined();
    expect(sogpEnrollments.referredByEnrollmentId).toBeDefined();
    expect(sogpEnrollments.whatsappConsent).toBeDefined();
    expect(sogpEnrollments.whatsappOptedInAt).toBeDefined();
    expect(sogpCohortTracks.curriculumLevel).toBeDefined();
    expect(sogpCohortTracks.curriculumOrder).toBeDefined();
    expect(sogpCohortTracks.isRequired).toBeDefined();
    expect(sogpCohortTracks.liveSessionNumber).toBeDefined();
  });

  test("tracks Prayer Watch attendance by session", () => {
    expect(prayerWatchAttendance.session).toBeDefined();
  });
});
