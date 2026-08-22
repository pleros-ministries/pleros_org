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

export function buildWelcomeShareMessage(siteUrl: string): string {
  return [
    "I thought this free book from Pleros would bless you.",
    "It gives clear answers about purpose, why we exist, and how to fulfill God's will.",
    `You can access it here: ${siteUrl}/welcome`,
  ].join(" ");
}

export function buildWelcomeShareIntentUrl(siteUrl: string): string {
  const message = buildWelcomeShareMessage(siteUrl);

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
