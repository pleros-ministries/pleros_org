import { expect, test } from "vitest";

import { sogpEnrollmentHtml } from "./templates";

test("escapes enrolment values and links to dashboard", () => {
  const html = sogpEnrollmentHtml({
    name: '<img src=x onerror="alert(1)">',
    cohortTitle: "September 2026",
    cohortDates: "7 September – 4 October 2026",
    dashboardUrl: "https://pleros.org/dashboard/sogp",
    telegramUrl: "https://t.me/example_bot?start=abc",
  });

  expect(html).not.toContain("<img src=x");
  expect(html).toContain("&lt;img src=x");
  expect(html).toContain("https://pleros.org/dashboard/sogp");
  expect(html).toContain("https://t.me/example_bot?start=abc");
});
