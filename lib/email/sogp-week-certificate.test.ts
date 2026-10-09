import { beforeEach, describe, expect, test, vi } from "vitest";

import { sogpWeekCertificateHtml, sogpWeekCertificateSubject } from "./templates";

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

const url = "https://pleros.org/dashboard/sogp/certificate";

describe("SOGP week certificate email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("congratulates one week in the shared branded shell", () => {
    const html = sogpWeekCertificateHtml({
      firstName: "Ada",
      weeks: [{ week: 2, title: "Doctrinal foundations" }],
      url,
    });
    expect(html).toContain("Week 2 complete");
    expect(html).toContain("Well done, Ada.");
    expect(html).toContain("Week 2: Doctrinal foundations");
    expect(html).toContain("View your certificates");
    expect(html).toContain(`href="${url}"`);
    expect(html).toContain("#e9ed01");
    // No decorative emoji.
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  test("escapes the learner's name", () => {
    const html = sogpWeekCertificateHtml({
      firstName: "<b>Ada</b>",
      weeks: [{ week: 1, title: "Gospel foundations and the Spirit" }],
      url,
    });
    expect(html).not.toContain("<b>Ada</b>");
    expect(html).toContain("&lt;b&gt;Ada&lt;/b&gt;");
  });

  test("groups several weeks into one email", () => {
    const html = sogpWeekCertificateHtml({
      firstName: "Ada",
      weeks: [
        { week: 2, title: "Two" },
        { week: 1, title: "One" },
      ],
      url,
    });
    expect(html).toContain("Weeks 1 and 2 complete");
    expect(sogpWeekCertificateSubject([1])).toBe("Your SOGP Week 1 certificate is ready");
    expect(sogpWeekCertificateSubject([1, 2, 3])).toBe(
      "Your SOGP Week 1, 2 and 3 certificates are ready",
    );
  });

  test("sends from the SOGP sender with the grouped subject", async () => {
    isEmailEnabled.mockReturnValue(true);
    const { sendSogpWeekCertificateEmail } = await import("./send");
    await sendSogpWeekCertificateEmail({
      to: "ada@example.com",
      firstName: "Ada",
      weeks: [{ week: 1, title: "One" }, { week: 2, title: "Two" }],
      url,
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@example.com",
        subject: "Your SOGP Week 1 and 2 certificates are ready",
        from: expect.stringContaining("Pleros Ministries & Missions"),
      }),
    );
  });
});
