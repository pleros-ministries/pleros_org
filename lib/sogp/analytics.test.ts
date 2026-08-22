import { expect, test } from "vitest";

import { sanitizeSogpAnalyticsPayload } from "./analytics";

test("drops direct learner identifiers from analytics payloads", () => {
  expect(
    sanitizeSogpAnalyticsPayload({
      cohort: "september-2026",
      day: 4,
      email: "ada@example.com",
      phone: "+2348000000000",
      name: "Ada",
    }),
  ).toEqual({ cohort: "september-2026", day: 4 });
});
