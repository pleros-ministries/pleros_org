const LOOPBACK_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

const KNOWN_PRODUCTION_ORIGINS = [
  "https://ppc.pleros.org",
  "https://pleros-org.vercel.app",
] as const;

type AuthEnv = Partial<
  Record<
    "BETTER_AUTH_URL" | "NEXT_PUBLIC_APP_URL" | "NODE_ENV" | "VERCEL" | "VERCEL_URL",
    string | undefined
  >
>;

function normalizeOrigin(value?: string): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();

  if (!trimmed) return undefined;

  try {
    return new URL(trimmed).origin;
  } catch {
    return undefined;
  }
}

function normalizeVercelOrigin(vercelUrl?: string): string | undefined {
  if (!vercelUrl) return undefined;

  const trimmed = vercelUrl.trim();

  if (!trimmed) return undefined;

  return normalizeOrigin(
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`,
  );
}

function isLoopbackOrigin(origin: string): boolean {
  const hostname = new URL(origin).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isLocalDevelopment(env: AuthEnv): boolean {
  return env.NODE_ENV !== "production" && env.VERCEL !== "1";
}

export function resolveAuthBaseUrl(env: AuthEnv): string | undefined {
  const betterAuthUrl = normalizeOrigin(env.BETTER_AUTH_URL);
  const publicAppUrl = normalizeOrigin(env.NEXT_PUBLIC_APP_URL);
  const vercelOrigin = normalizeVercelOrigin(env.VERCEL_URL);

  if (isLocalDevelopment(env)) {
    if (publicAppUrl && isLoopbackOrigin(publicAppUrl)) {
      return publicAppUrl;
    }

    if (betterAuthUrl && isLoopbackOrigin(betterAuthUrl)) {
      return betterAuthUrl;
    }

    return LOOPBACK_ORIGINS[0];
  }

  return betterAuthUrl ?? publicAppUrl ?? vercelOrigin;
}

export function buildTrustedOrigins(env: AuthEnv): string[] {
  const origins = new Set<string>();
  const baseUrl = resolveAuthBaseUrl(env);

  if (baseUrl) {
    origins.add(baseUrl);
  }

  if (isLocalDevelopment(env)) {
    for (const origin of LOOPBACK_ORIGINS) {
      origins.add(origin);
    }
  }

  for (const origin of KNOWN_PRODUCTION_ORIGINS) {
    origins.add(origin);
  }

  return Array.from(origins);
}
