const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): boolean {
  const normalized = normalizeEmail(value);
  return EMAIL_REGEX.test(normalized);
}
