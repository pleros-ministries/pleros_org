const DEFAULT_PUBLIC_SITE_URL = "https://pleros.org";

function normalizePublicOrigin(url: string | undefined): string | null {
  const configuredUrl = url?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return null;
  }
}

export function resolvePublicSiteUrl(env: NodeJS.ProcessEnv): string {
  const configuredPublicUrl =
    normalizePublicOrigin(env.NEXT_PUBLIC_SITE_URL) ??
    normalizePublicOrigin(env.NEXT_PUBLIC_PUBLIC_SITE_URL);

  if (configuredPublicUrl) {
    return configuredPublicUrl;
  }

  return DEFAULT_PUBLIC_SITE_URL;
}

export function buildWelcomeShareIntentUrl(siteUrl: string): string {
  const message = [
    "I found a free gift from Pleros that I thought would bless you.",
    `You can access it here: ${siteUrl}/welcome`,
  ].join(" ");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
