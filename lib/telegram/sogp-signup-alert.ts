export type SogpSignupAlertInput = {
  /** sogp_enrollments serial id — the running count of enrolment rows. */
  enrollmentId: number;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  region: string;
  birthYear: number | null;
  /** Already formatted via formatSogpReferralSource. */
  referralSource: string;
  cohortTitle: string;
};

export function formatSogpSignupAlert(input: SogpSignupAlertInput): string {
  const name = `${input.firstName} ${input.lastName}`.trim();
  const lines = [
    `🎓 New SOGP enrolment #${input.enrollmentId}`,
    "",
    `Name: ${name || "—"}`,
    `Phone: ${input.phone || "—"}`,
    `Country: ${input.country || "—"}`,
    `State: ${input.region || "—"}`,
  ];

  if (input.birthYear) {
    lines.push(`Year of birth: ${input.birthYear}`);
  }

  lines.push(`Heard about us: ${input.referralSource || "—"}`);
  lines.push(`Cohort: ${input.cohortTitle}`);

  return lines.join("\n");
}

export async function sendSogpSignupAlert(
  input: SogpSignupAlertInput,
  options?: {
    botToken?: string;
    chatId?: string;
    fetcher?: typeof fetch;
  },
) {
  const botToken = options?.botToken ?? process.env.TELEGRAM_SOGP_BOT_TOKEN;
  const chatId = options?.chatId ?? process.env.TELEGRAM_SOGP_SIGNUP_CHAT_ID;
  const fetcher = options?.fetcher ?? fetch;

  // Capability flag: stay silent (and never break enrolment) when unconfigured.
  if (!botToken || !chatId) return null;

  const response = await fetcher(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatSogpSignupAlert(input),
        disable_web_page_preview: true,
      }),
    },
  );
  const payload = (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: { message_id?: number };
  };

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description ?? "SOGP signup alert failed.");
  }

  return { messageId: payload.result?.message_id };
}
