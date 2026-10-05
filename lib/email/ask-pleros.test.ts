import { beforeEach, describe, expect, test, vi } from "vitest";

import { staffAskerLabel, staffAskerView } from "../community/ask-pleros";
import { askPlerosStaffNotificationHtml, plerosReplyHtml } from "./templates";

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

const adminUrl = "https://pleros.org/admin/questions?question=7";

describe("Ask Pleros staff email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ASK_PLEROS_INBOX_EMAIL;
    delete process.env.CONTACT_INBOX_EMAIL;
  });

  test("an anonymous question's email carries nothing about the asker", () => {
    // Even if a caller holds the asker's details, the staff view drops them.
    const asker = staffAskerView({
      isAnonymous: true,
      name: "Ada Grace Nwosu",
      groupName: "Lagos, Nigeria",
    });
    const html = askPlerosStaffNotificationHtml({
      askerLabel: staffAskerLabel(asker),
      groupName: asker.anonymous ? null : asker.groupName,
      message: "How do I forgive someone?",
      isFollowUp: false,
      adminUrl,
    });

    expect(html).toContain("Anonymous");
    expect(html).toContain("How do I forgive someone?");
    expect(html).toContain("/admin/questions?question=7");
    expect(html).not.toContain("Ada");
    expect(html).not.toContain("Nwosu");
    expect(html).not.toContain("Lagos");
    expect(html).not.toContain("Group</td>");
  });

  test("a named question shows the name and group, and escapes the message", () => {
    const html = askPlerosStaffNotificationHtml({
      askerLabel: "Ada Grace Nwosu",
      groupName: "Lagos, Nigeria",
      message: "<script>alert(1)</script>",
      isFollowUp: true,
      adminUrl,
    });

    expect(html).toContain("Ada Grace Nwosu");
    expect(html).toContain("Lagos, Nigeria");
    expect(html).toContain("Follow-up on a question");
    expect(html).not.toContain("<script>");
  });

  test("sends to the Ask Pleros inbox with no reply-to and an anonymous subject", async () => {
    process.env.ASK_PLEROS_INBOX_EMAIL = "ask@pleros.org";
    process.env.CONTACT_INBOX_EMAIL = "team@pleros.org";
    isEmailEnabled.mockReturnValue(true);
    sendEmail.mockResolvedValue({});
    const { sendAskPlerosStaffNotification } = await import("./send");

    const result = await sendAskPlerosStaffNotification({
      askerLabel: "Anonymous",
      groupName: null,
      message: "How do I forgive someone?",
      isFollowUp: false,
      isAnonymous: true,
      adminUrl,
    });

    expect(result).toEqual({ ok: true });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const sent = sendEmail.mock.calls[0][0];
    expect(sent.to).toBe("ask@pleros.org");
    expect(sent.subject).toBe("New anonymous question for Pleros");
    expect(sent.replyTo).toBeUndefined();
  });

  test("falls back to the contact inbox, and reports when there is none", async () => {
    isEmailEnabled.mockReturnValue(true);
    sendEmail.mockResolvedValue({});
    const { sendAskPlerosStaffNotification } = await import("./send");
    const input = {
      askerLabel: "Ada Grace Nwosu",
      groupName: null,
      message: "Hello",
      isFollowUp: false,
      isAnonymous: false,
      adminUrl,
    };

    expect(await sendAskPlerosStaffNotification(input)).toEqual({
      ok: false,
      reason: "missing_inbox",
    });
    expect(sendEmail).not.toHaveBeenCalled();

    process.env.CONTACT_INBOX_EMAIL = "team@pleros.org";
    expect(await sendAskPlerosStaffNotification(input)).toEqual({ ok: true });
    expect(sendEmail.mock.calls[0][0].to).toBe("team@pleros.org");
    expect(sendEmail.mock.calls[0][0].subject).toBe(
      "New question for Pleros from Ada Grace Nwosu",
    );
  });
});

describe("Ask Pleros reply email", () => {
  test("links to the conversation without quoting it", () => {
    const html = plerosReplyHtml({
      url: "https://pleros.org/dashboard/community/ask/7",
    });

    expect(html).toContain("Pleros has replied to your question");
    expect(html).toContain("/dashboard/community/ask/7");
    expect(html).toContain("does not include your question or the reply");
  });
});
