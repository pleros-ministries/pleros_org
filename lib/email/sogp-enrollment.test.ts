import { expect, test } from "vitest";

import {
  SOGP_ENROLLMENT_SUBJECT,
  sogpEnrollmentHtml,
} from "./templates";

test("prioritises the Telegram channel without exposing a dashboard link", () => {
  const html = sogpEnrollmentHtml({
    name: '<img src=x onerror="alert(1)">',
    cohortTitle: "September 2026",
    cohortDates: "7 September – 4 October 2026",
    telegramUrl: "https://t.me/example_bot?start=abc",
  });

  expect(SOGP_ENROLLMENT_SUBJECT).toBe(
    "Your SOGP enrolment is confirmed — join Telegram now",
  );
  expect(html).not.toContain("<img src=x");
  expect(html).toContain("&lt;img src=x");
  expect(html).not.toContain("dashboard/sogp");
  expect(html).not.toContain("Open your SOGP dashboard");
  expect(html).toContain("https://t.me/example_bot?start=abc");
  expect(html).toContain("Join the Telegram channel now");
  expect(html).toContain("information, gifts, reminders, and updates");
  expect(html).toContain("dashboard link");
});
