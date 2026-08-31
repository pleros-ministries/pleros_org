import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  SOGP_ENROLLMENT_SUBJECT,
  sogpEnrollmentHtml,
} from "./templates";

const sendEmail = vi.fn();
const isEmailEnabled = vi.fn();

vi.mock("./resend", () => ({
  resend: {
    emails: {
      send: sendEmail,
    },
  },
  isEmailEnabled,
}));

describe("SOGP enrolment email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isEmailEnabled.mockReturnValue(true);
    vi.stubEnv("EMAIL_FROM_PLEROS", "Pleros Media <noreply@pleros.org>");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("routes learners directly to the Welcome Pack introduction", () => {
    const html = sogpEnrollmentHtml({
      name: '<img src=x onerror="alert(1)">',
      cohortTitle: "September 2026",
      cohortDates: "7 September – 4 October 2026",
      dashboardUrl: "https://pleros.org/dashboard/welcomepack/join",
    });

    expect(SOGP_ENROLLMENT_SUBJECT).toBe(
      "Your SOGP enrolment is confirmed — visit your dashboard",
    );
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
    expect(html).toContain(
      'href="https://pleros.org/dashboard/welcomepack/join"',
    );
    expect(html).toContain(
      "Visit your dashboard for the welcome video and your next steps",
    );
    expect(html).toContain(">Open Dashboard</a>");
    expect(html.match(/Visit your dashboard/g)).toHaveLength(1);
    expect(html).not.toContain("Your Welcome Pack contains");
    expect(html).not.toContain("✓");
    expect(html).not.toContain("Join the Telegram channel now");
    expect(html).not.toContain("dashboard link will be shared");
  });

  test("uses the ministry name while preserving the configured sender address", async () => {
    const { sendSogpEnrollmentEmail } = await import("./send");

    await sendSogpEnrollmentEmail({
      to: "learner@example.com",
      name: "Ada",
      cohortTitle: "September 2026",
      cohortDates: "7 September – 4 October 2026",
      dashboardUrl: "https://pleros.org/dashboard/welcomepack/join",
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Pleros Ministries & Missions <noreply@pleros.org>",
        to: "learner@example.com",
      }),
    );
  });
});
