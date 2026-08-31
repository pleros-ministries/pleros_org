const DEFAULT_WELCOME_RETURN_TO = "/dashboard";

export function normalizeWelcomeReturnTo(
  value: string | null | undefined,
  fallback = DEFAULT_WELCOME_RETURN_TO,
): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
