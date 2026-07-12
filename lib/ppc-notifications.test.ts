import { describe, expect, test } from "vitest";

import {
  getPpcNotificationStatus,
  getPushSubscriptionAction,
  getPushSubscriptionCopy,
} from "./ppc-notifications";

describe("ppc notification status", () => {
  test("marks all notification surfaces ready when required configuration exists", () => {
    expect(
      getPpcNotificationStatus({
        RESEND_API_KEY: "re_123",
        EMAIL_FROM: "PPC <noreply@pleros.org>",
        NEXT_PUBLIC_APP_URL: "https://ppc.pleros.org",
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: "public-key",
        VAPID_PRIVATE_KEY: "private-key",
        VAPID_SUBJECT: "mailto:admin@pleros.org",
        CRON_SECRET: "secret",
      }),
    ).toEqual({
      summary: {
        ready: 5,
        warning: 0,
        blocked: 0,
        headline: "5 ready · 0 warnings · 0 blocked",
      },
      channels: [
        {
          id: "email",
          label: "Email",
          state: "ready",
          detail: "Transactional email is enabled from PPC <noreply@pleros.org>.",
          missing: [],
        },
        {
          id: "push",
          label: "Browser push",
          state: "ready",
          detail: "Web push is configured for mailto:admin@pleros.org.",
          missing: [],
        },
        {
          id: "cron",
          label: "Inactivity cron",
          state: "ready",
          detail: "Cron endpoint is protected with CRON_SECRET.",
          missing: [],
        },
      ],
      events: [
        {
          id: "staff_assignments",
          label: "Review and Q&A assignment alerts",
          state: "ready",
          detail: "Assignments can notify staff by email and browser push.",
        },
        {
          id: "student_lifecycle",
          label: "Student lifecycle emails",
          state: "ready",
          detail: "Submission review, graduation, and inactivity emails can be sent.",
        },
      ],
    });
  });

  test("reports missing notification configuration without hiding partial readiness", () => {
    const status = getPpcNotificationStatus({
      NEXT_PUBLIC_APP_URL: "https://ppc.pleros.org",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "public-key",
    });

    expect(status.summary).toEqual({
      ready: 0,
      warning: 1,
      blocked: 4,
      headline: "0 ready · 1 warning · 4 blocked",
    });
    expect(status.channels).toEqual([
      {
        id: "email",
        label: "Email",
        state: "blocked",
        detail: "Transactional email is blocked until Resend is configured.",
        missing: ["RESEND_API_KEY"],
      },
      {
        id: "push",
        label: "Browser push",
        state: "blocked",
        detail: "Web push needs both public and private VAPID keys.",
        missing: ["VAPID_PRIVATE_KEY"],
      },
      {
        id: "cron",
        label: "Inactivity cron",
        state: "warning",
        detail: "Cron endpoint works, but requests are not protected by CRON_SECRET.",
        missing: ["CRON_SECRET"],
      },
    ]);
    expect(status.events).toEqual([
      {
        id: "staff_assignments",
        label: "Review and Q&A assignment alerts",
        state: "blocked",
        detail: "Assignment alerts need email or browser push configuration.",
      },
      {
        id: "student_lifecycle",
        label: "Student lifecycle emails",
        state: "blocked",
        detail: "Student lifecycle notifications need Resend email configuration.",
      },
    ]);
  });

  test("uses role-specific push subscription copy", () => {
    expect(getPushSubscriptionCopy("staff")).toEqual({
      unavailable:
        "Add VAPID keys before staff can subscribe from this page.",
      subscribed: "This device can receive PPC assignment alerts.",
      available:
        "Subscribe this browser to receive staff assignment push alerts.",
    });

    expect(getPushSubscriptionCopy("student")).toEqual({
      unavailable:
        "Course reminders are unavailable until push notifications are configured.",
      subscribed: "This device can receive PPC course reminders.",
      available:
        "Subscribe this browser to receive reminders about lessons and course progress.",
    });
  });

  test("uses status pills instead of disabled push buttons for blocked states", () => {
    expect(
      getPushSubscriptionAction({
        isPushConfigured: false,
        isSupported: true,
        isSubscribed: false,
        isPending: false,
      }),
    ).toEqual({
      kind: "status",
      label: "Push setup required",
      tone: "muted",
    });

    expect(
      getPushSubscriptionAction({
        isPushConfigured: true,
        isSupported: false,
        isSubscribed: false,
        isPending: false,
      }),
    ).toEqual({
      kind: "status",
      label: "Browser unsupported",
      tone: "muted",
    });
  });

  test("shows a push subscribe button only when the browser can act", () => {
    expect(
      getPushSubscriptionAction({
        isPushConfigured: true,
        isSupported: true,
        isSubscribed: false,
        isPending: false,
      }),
    ).toEqual({
      kind: "button",
      label: "Enable push alerts",
      disabled: false,
    });

    expect(
      getPushSubscriptionAction({
        isPushConfigured: true,
        isSupported: true,
        isSubscribed: false,
        isPending: true,
      }),
    ).toEqual({
      kind: "button",
      label: "Subscribing",
      disabled: true,
    });

    expect(
      getPushSubscriptionAction({
        isPushConfigured: true,
        isSupported: true,
        isSubscribed: true,
        isPending: false,
      }),
    ).toEqual({
      kind: "status",
      label: "Alerts enabled",
      tone: "success",
    });
  });
});
