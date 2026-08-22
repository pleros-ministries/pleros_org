export type SogpBroadcastKind =
  | "preparation"
  | "track_release"
  | "live_class"
  | "general";

export type SogpBroadcastInput = {
  kind: SogpBroadcastKind;
  message: string;
};

const SUPPORTED_KINDS = new Set<SogpBroadcastKind>([
  "preparation",
  "track_release",
  "live_class",
  "general",
]);

export function normalizeSogpBroadcast(
  input: SogpBroadcastInput,
): SogpBroadcastInput {
  if (!SUPPORTED_KINDS.has(input.kind)) {
    throw new Error("Unsupported SOGP broadcast type.");
  }

  const message = input.message.trim();
  if (!message) throw new Error("Message is required.");
  if (message.length > 4_096) {
    throw new Error("Telegram messages cannot exceed 4,096 characters.");
  }

  return { kind: input.kind, message };
}

export async function sendSogpChannelMessage(
  input: SogpBroadcastInput,
  options?: {
    botToken?: string;
    channelId?: string;
    fetcher?: typeof fetch;
  },
) {
  const normalized = normalizeSogpBroadcast(input);
  const botToken = options?.botToken ?? process.env.TELEGRAM_SOGP_BOT_TOKEN;
  const channelId = options?.channelId ?? process.env.TELEGRAM_SOGP_CHANNEL_ID;
  const fetcher = options?.fetcher ?? fetch;

  if (!botToken) throw new Error("TELEGRAM_SOGP_BOT_TOKEN is required.");
  if (!channelId) throw new Error("TELEGRAM_SOGP_CHANNEL_ID is required.");

  const response = await fetcher(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text: normalized.message,
        disable_web_page_preview: false,
      }),
    },
  );
  const payload = (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: { message_id?: number };
  };

  if (!response.ok || !payload.ok || !payload.result?.message_id) {
    throw new Error(payload.description ?? "Telegram broadcast failed.");
  }

  return { messageId: payload.result.message_id };
}
