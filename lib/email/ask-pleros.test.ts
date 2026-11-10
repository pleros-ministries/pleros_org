import { beforeEach, describe, expect, test, vi } from "vitest";

import { staffAskerLabel, staffAskerView } from "../community/ask-pleros";
import { askPlerosStaffNotificationHtml, plerosReplyHtml } from "./templates";

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

const adminUrl = "https://pleros.org/admin/questions?question=7";

describe("Ask Pleros staff email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  test("sends each admin their own copy with no reply-to and an anonymous subject", async () => {
    isEmailEnabled.mockReturnValue(true);
    sendBatch.mockResolvedValue({ data: {}, error: null });
    const { sendAskPlerosStaffNotification } = await import("./send");

    const result = await sendAskPlerosStaffNotification(
      ["admin@pleros.org", "super@pleros.org"],
      {
        askerLabel: "Anonymous",
        groupName: null,
        message: "How do I forgive someone?",
        isFollowUp: false,
        isAnonymous: true,
        adminUrl,
      },
    );

    expect(result).toEqual({ ok: true });
    expect(sendBatch).toHaveBeenCalledTimes(1);
    const emails = sendBatch.mock.calls[0][0];
    expect(emails.map((email: { to: string }) => email.to)).toEqual([
      "admin@pleros.org",
      "super@pleros.org",
    ]);
    expect(emails[0].subject).toBe("New anonymous question for Pleros");
    expect(emails[0].replyTo).toBeUndefined();
  });

  test("names the asker in the subject, and reports when there are no admins", async () => {
    isEmailEnabled.mockReturnValue(true);
    sendBatch.mockResolvedValue({ data: {}, error: null });
    const { sendAskPlerosStaffNotification } = await import("./send");
    const input = {
      askerLabel: "Ada Grace Nwosu",
      groupName: null,
      message: "Hello",
      isFollowUp: false,
      isAnonymous: false,
      adminUrl,
    };

    expect(await sendAskPlerosStaffNotification([], input)).toEqual({
      ok: false,
      reason: "no_recipients",
    });
    expect(sendBatch).not.toHaveBeenCalled();

    expect(await sendAskPlerosStaffNotification(["admin@pleros.org"], input)).toEqual({
      ok: true,
    });
    expect(sendBatch.mock.calls[0][0][0].subject).toBe(
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
