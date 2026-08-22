import { createHmac, randomBytes } from "node:crypto";

type TelegramStartUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number };
  };
};

function hashToken(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function getSogpTelegramLinkSecret(env: NodeJS.ProcessEnv) {
  const secret = env.TELEGRAM_SOGP_LINK_SECRET ?? env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("TELEGRAM_SOGP_LINK_SECRET is required.");
  return secret;
}

export function createSogpTelegramLink(input: {
  enrollmentId: number;
  botUsername: string;
  secret: string;
}) {
  const nonce = randomBytes(18).toString("base64url");
  const startParameter = `e${input.enrollmentId}_${nonce}`;
  const botUsername = input.botUsername.replace(/^@/, "");

  return {
    url: `https://t.me/${botUsername}?start=${startParameter}`,
    startParameter,
    tokenHash: hashToken(startParameter, input.secret),
  };
}

export function hashSogpTelegramStartToken(token: string, secret: string) {
  return hashToken(token, secret);
}

export function parseSogpTelegramStart(update: TelegramStartUpdate) {
  const message = update.message;
  if (
    message?.chat?.type !== "private" ||
    typeof message.text !== "string" ||
    typeof message.chat.id !== "number" ||
    typeof message.from?.id !== "number"
  ) {
    return null;
  }

  const match = message.text.trim().match(/^\/start\s+([A-Za-z0-9_-]{1,64})$/);
  if (!match?.[1]) return null;

  return {
    token: match[1],
    telegramUserId: String(message.from.id),
    chatId: String(message.chat.id),
  };
}
