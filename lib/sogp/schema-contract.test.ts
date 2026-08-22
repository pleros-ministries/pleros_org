import { describe, expect, test } from "vitest";

import {
  sogpCertificates,
  sogpCohorts,
  sogpCohortTracks,
  sogpEnrollments,
  sogpLiveClassAttendance,
  sogpLiveClasses,
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
    expect(sogpCertificates).toBeDefined();
    expect(sogpRewardGrants).toBeDefined();
  });

  test("tracks Prayer Watch attendance by session", () => {
    expect(prayerWatchAttendance.session).toBeDefined();
  });
});
