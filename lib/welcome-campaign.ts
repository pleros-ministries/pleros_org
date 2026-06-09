const DEFAULT_PUBLIC_SITE_URL = "https://pleros-org.vercel.app";

export function resolvePublicSiteUrl(env: NodeJS.ProcessEnv): string {
  const configuredUrl = env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    return DEFAULT_PUBLIC_SITE_URL;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return DEFAULT_PUBLIC_SITE_URL;
  }
}

export function buildWelcomeShareIntentUrl(siteUrl: string): string {
  const message = [
    "I found a free gift from Pleros that I thought would bless you.",
    `You can access it here: ${siteUrl}/welcome`,
  ].join(" ");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
