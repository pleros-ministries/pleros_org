type NotificationEnvironment = Partial<
  Pick<
    NodeJS.ProcessEnv,
    | "RESEND_API_KEY"
    | "EMAIL_FROM"
    | "NEXT_PUBLIC_APP_URL"
    | "BETTER_AUTH_URL"
    | "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
    | "VAPID_PRIVATE_KEY"
    | "VAPID_SUBJECT"
    | "CRON_SECRET"
  >
>;

type NotificationState = "ready" | "warning" | "blocked";

type NotificationChannelStatus = {
  id: "email" | "push" | "cron";
  label: string;
  state: NotificationState;
  detail: string;
  missing: string[];
};

type NotificationEventStatus = {
  id: "staff_assignments" | "student_lifecycle";
  label: string;
  state: NotificationState;
  detail: string;
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function getEmailStatus(env: NotificationEnvironment): NotificationChannelStatus {
  if (!hasValue(env.RESEND_API_KEY)) {
    return {
      id: "email",
      label: "Email",
      state: "blocked",
      detail: "Transactional email is blocked until Resend is configured.",
      missing: ["RESEND_API_KEY"],
    };
  }

  return {
    id: "email",
    label: "Email",
    state: "ready",
    detail: `Transactional email is enabled from ${
      env.EMAIL_FROM?.trim() || "PPC <noreply@pleros.org>"
    }.`,
    missing: [],
  };
}

function getPushStatus(env: NotificationEnvironment): NotificationChannelStatus {
  const missing = [
    hasValue(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      ? null
      : "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    hasValue(env.VAPID_PRIVATE_KEY) ? null : "VAPID_PRIVATE_KEY",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return {
      id: "push",
      label: "Browser push",
      state: "blocked",
      detail: "Web push needs both public and private VAPID keys.",
      missing,
    };
  }

  return {
    id: "push",
    label: "Browser push",
    state: "ready",
    detail: `Web push is configured for ${
      env.VAPID_SUBJECT?.trim() || "mailto:admin@pleros.org"
    }.`,
    missing: [],
  };
}

function getCronStatus(env: NotificationEnvironment): NotificationChannelStatus {
  if (!hasValue(env.CRON_SECRET)) {
    return {
      id: "cron",
      label: "Inactivity cron",
      state: "warning",
      detail: "Cron endpoint works, but requests are not protected by CRON_SECRET.",
      missing: ["CRON_SECRET"],
    };
  }

  return {
    id: "cron",
    label: "Inactivity cron",
    state: "ready",
    detail: "Cron endpoint is protected with CRON_SECRET.",
    missing: [],
  };
}

function countByState(
  rows: Array<{ state: NotificationState }>,
  state: NotificationState,
) {
  return rows.filter((row) => row.state === state).length;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getPpcNotificationStatus(env: NotificationEnvironment) {
  const channels = [getEmailStatus(env), getPushStatus(env), getCronStatus(env)];
  const emailReady = channels.find((channel) => channel.id === "email")?.state === "ready";
  const pushReady = channels.find((channel) => channel.id === "push")?.state === "ready";

  const events: NotificationEventStatus[] = [
    {
      id: "staff_assignments",
      label: "Review and Q&A assignment alerts",
      state: emailReady || pushReady ? "ready" : "blocked",
      detail:
        emailReady && pushReady
          ? "Assignments can notify staff by email and browser push."
          : emailReady
            ? "Assignments can notify staff by email."
            : pushReady
              ? "Assignments can notify staff by browser push."
              : "Assignment alerts need email or browser push configuration.",
    },
    {
      id: "student_lifecycle",
      label: "Student lifecycle emails",
      state: emailReady ? "ready" : "blocked",
      detail: emailReady
        ? "Submission review, graduation, and inactivity emails can be sent."
        : "Student lifecycle notifications need Resend email configuration.",
    },
  ];
  const rows = [...channels, ...events];
  const ready = countByState(rows, "ready");
  const warning = countByState(rows, "warning");
  const blocked = countByState(rows, "blocked");

  return {
    summary: {
      ready,
      warning,
      blocked,
      headline: `${pluralize(ready, "ready", "ready")} · ${pluralize(
        warning,
        "warning",
      )} · ${pluralize(blocked, "blocked", "blocked")}`,
    },
    channels,
    events,
  };
}
