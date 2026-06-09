import { beforeEach, describe, expect, test, vi } from "vitest";

import { contactSubmissionNotificationHtml } from "./templates";

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

describe("contact submission email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CONTACT_INBOX_EMAIL;
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

  test("returns a clear result when the contact inbox is missing", async () => {
    isEmailEnabled.mockReturnValue(true);
    const { sendContactSubmissionNotification } = await import("./send");

    await expect(
      sendContactSubmissionNotification({
        adminUrl: "https://pleros-org.vercel.app/admin/contact?submission=18",
        email: "ada@example.com",
        fullName: "Ada Lovelace",
        location: "Lagos",
        message: "Please tell me more about the ministry.",
        phone: "+234 555 0101",
        submittedAt: "2026-06-08T12:30:00.000Z",
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "missing_contact_inbox",
    });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  test("fails gracefully when email delivery is unavailable", async () => {
    process.env.CONTACT_INBOX_EMAIL = "team@pleros.org";
    isEmailEnabled.mockReturnValue(false);
    const { sendContactSubmissionNotification } = await import("./send");

    await expect(
      sendContactSubmissionNotification({
        adminUrl: "https://pleros-org.vercel.app/admin/contact?submission=18",
        email: "ada@example.com",
        fullName: "Ada Lovelace",
        location: null,
        message: "Please tell me more about the ministry.",
        phone: "+234 555 0101",
        submittedAt: "2026-06-08T12:30:00.000Z",
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "email_unavailable",
    });

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
