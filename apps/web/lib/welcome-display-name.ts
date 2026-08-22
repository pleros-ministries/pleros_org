import { normalizeEmail } from "./welcome-flow";
import { resolveWelcomeAccessName } from "./welcome-access";

type WelcomeDisplayNameInput = {
  email?: string | null;
  leadName?: string | null;
  welcomeName?: string | null;
  sessionName?: string | null;
};

function normalizeDisplayCandidate(value: string | null | undefined) {
  return value?.trim() || null;
}

export function isEmailDerivedWelcomeName(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  const candidate = normalizeDisplayCandidate(name);

  if (!candidate || !email) {
    return false;
  }

  const normalizedEmail = normalizeEmail(email);
  const localPart = normalizedEmail.split("@")[0] ?? "";
  const normalizedCandidate = candidate.toLowerCase();

  return (
    normalizedCandidate === normalizedEmail ||
    normalizedCandidate === localPart ||
    normalizedCandidate === resolveWelcomeAccessName(normalizedEmail).toLowerCase()
  );
}

export function resolveWelcomeDisplayName({
  email,
  leadName,
  welcomeName,
  sessionName,
}: WelcomeDisplayNameInput) {
  const candidates = [leadName, welcomeName, sessionName];

  return (
    candidates.find((candidate) => {
      const normalized = normalizeDisplayCandidate(candidate);

      return normalized && !isEmailDerivedWelcomeName(normalized, email);
    })?.trim() ?? null
  );
}
