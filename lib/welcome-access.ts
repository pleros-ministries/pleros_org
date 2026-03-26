import { createHmac, timingSafeEqual } from "node:crypto";

import { normalizeEmail } from "./welcome-flow";

export const WELCOME_ACCESS_COOKIE_NAME = "pleros_welcome_access";
export const WELCOME_ACCESS_MAX_AGE = 60 * 60 * 24 * 7;

export type WelcomeAccessPayload = {
  email: string;
  name: string;
};

function encodeSegment(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeSegment(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function signValue(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function resolveWelcomeAccessName(email: string): string {
  const localPart = normalizeEmail(email).split("@")[0] ?? "";
  const cleaned = localPart
    .replace(/[._-]+/g, " ")
    .trim();

  if (!cleaned) {
    return "Pleros Guest";
  }

  return cleaned.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function createWelcomeAccessToken(
  payload: WelcomeAccessPayload,
  secret: string,
): string {
  const serializedPayload = JSON.stringify({
    email: normalizeEmail(payload.email),
    name: payload.name.trim() || resolveWelcomeAccessName(payload.email),
  });
  const encodedPayload = encodeSegment(serializedPayload);

  return `${encodedPayload}.${signValue(encodedPayload, secret)}`;
}

export function getWelcomeAccessSecret(env: NodeJS.ProcessEnv): string {
  return (
    env.WELCOME_ACCESS_SECRET ??
    env.BETTER_AUTH_SECRET ??
    "demo-only-welcome-access-secret-change-in-production-12345"
  );
}

export function parseWelcomeAccessToken(
  token: string,
  secret: string,
): WelcomeAccessPayload | null {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload, secret);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  const decodedPayload = decodeSegment(encodedPayload);

  if (!decodedPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodedPayload) as Partial<WelcomeAccessPayload>;

    if (typeof parsed.email !== "string" || typeof parsed.name !== "string") {
      return null;
    }

    const email = normalizeEmail(parsed.email);
    const name = parsed.name.trim();

    if (!email || !name) {
      return null;
    }

    return {
      email,
      name,
    };
  } catch {
    return null;
  }
}

export function readWelcomeAccessToken(
  token: string | undefined,
  env: NodeJS.ProcessEnv,
): WelcomeAccessPayload | null {
  if (!token) {
    return null;
  }

  return parseWelcomeAccessToken(token, getWelcomeAccessSecret(env));
}
