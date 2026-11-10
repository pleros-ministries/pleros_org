import { beforeEach, describe, expect, test, vi } from "vitest";

import { contactSubmissionNotificationHtml } from "./templates";

const sendBatch = vi.fn();
const isEmailEnabled = vi.fn();

vi.mock("./resend", () => ({
  resend: {
    batch: {
      send: sendBatch,
    },
  },
  isEmailEnabled,
}));

describe("contact submission email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("template includes sender details, message, location, and admin link", () => {
    const html = contactSubmissionNotificationHtml({
      adminUrl: "https://pleros-org.vercel.app/admin/contact?submission=18",
      email: "ada@example.com",
      fullName: "Ada Lovelace",
      location: "Lagos",
      message: "Please tell me more about the ministry.",
      phone: "+234 555 0101",
      submittedAt: "2026-06-08T12:30:00.000Z",
    });

    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("ada@example.com");
    expect(html).toContain("+234 555 0101");
    expect(html).toContain("Lagos");
    expect(html).toContain("Please tell me more about the ministry.");
    expect(html).toContain("/admin/contact?submission=18");
  });

  test("escapes public submission fields before rendering html", () => {
    const html = contactSubmissionNotificationHtml({
      adminUrl: "https://pleros-org.vercel.app/admin/contact?submission=18",
      email: 'ada@example.com"><script>alert(1)</script>',
      fullName: "<b>Ada</b>",
      location: "<Lagos>",
      message: 'Hello <img src=x onerror="alert(1)">',
      phone: '"+234"',
      submittedAt: "2026-06-08T12:30:00.000Z",
    });

    expect(html).toContain("&lt;b&gt;Ada&lt;/b&gt;");
    expect(html).toContain("&lt;Lagos&gt;");
    expect(html).toContain("Hello &lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("&quot;+234&quot;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  const submission = {
    adminUrl: "https://pleros-org.vercel.app/admin/contact?submission=18",
    email: "ada@example.com",
    fullName: "Ada Lovelace",
    location: "Lagos",
    message: "Please tell me more about the ministry.",
    phone: "+234 555 0101",
    submittedAt: "2026-06-08T12:30:00.000Z",
  };

  test("sends each admin and super admin their own copy, replying to the sender", async () => {
    isEmailEnabled.mockReturnValue(true);
    sendBatch.mockResolvedValue({ data: {}, error: null });
    const { sendContactSubmissionNotification } = await import("./send");

    await expect(
      sendContactSubmissionNotification(
        ["Admin@pleros.org", "super@pleros.org", "admin@pleros.org"],
        submission,
      ),
    ).resolves.toEqual({ ok: true });

    expect(sendBatch).toHaveBeenCalledTimes(1);
    const emails = sendBatch.mock.calls[0][0];
    expect(emails.map((email: { to: string }) => email.to)).toEqual([
      "admin@pleros.org",
      "super@pleros.org",
    ]);
    expect(emails[0].replyTo).toBe("ada@example.com");
    expect(emails[0].subject).toBe("New contact submission from Ada Lovelace");
  });

  test("returns a clear result when there are no admins", async () => {
    isEmailEnabled.mockReturnValue(true);
    const { sendContactSubmissionNotification } = await import("./send");

    await expect(sendContactSubmissionNotification([], submission)).resolves.toEqual({
      ok: false,
      reason: "no_recipients",
    });
    expect(sendBatch).not.toHaveBeenCalled();
  });

  test("reports a failure Resend returns rather than throws", async () => {
    isEmailEnabled.mockReturnValue(true);
    sendBatch.mockResolvedValue({ data: null, error: { message: "rate limited" } });
    const { sendContactSubmissionNotification } = await import("./send");

    await expect(
      sendContactSubmissionNotification(["admin@pleros.org"], submission),
    ).resolves.toEqual({ ok: false, reason: "send_failed" });
  });

  test("fails gracefully when email delivery is unavailable", async () => {
    isEmailEnabled.mockReturnValue(false);
    const { sendContactSubmissionNotification } = await import("./send");

    await expect(
      sendContactSubmissionNotification(["admin@pleros.org"], submission),
    ).resolves.toEqual({
      ok: false,
      reason: "email_unavailable",
    });
    expect(sendBatch).not.toHaveBeenCalled();
  });
});
