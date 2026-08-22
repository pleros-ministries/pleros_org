export type SogpEnrollmentValues = {
  name: string;
  email: string;
  phone: string;
  country: string;
  reason: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
};

export type SogpEnrollmentInput = Partial<SogpEnrollmentValues>;
export type SogpEnrollmentErrors = Partial<
  Record<"name" | "email" | "phone" | "country" | "reason", string>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s()-]{6,19}$/;

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeSogpEnrollment(
  input: SogpEnrollmentInput,
): SogpEnrollmentValues {
  return {
    name: clean(input.name, 120),
    email: clean(input.email, 320).toLowerCase(),
    phone: clean(input.phone, 24),
    country: clean(input.country, 100),
    reason: typeof input.reason === "string" ? input.reason.trim() : "",
    utmSource: clean(input.utmSource, 200),
    utmMedium: clean(input.utmMedium, 200),
    utmCampaign: clean(input.utmCampaign, 200),
    utmContent: clean(input.utmContent, 200),
    utmTerm: clean(input.utmTerm, 200),
  };
}

export function validateSogpEnrollment(
  input: SogpEnrollmentValues,
): SogpEnrollmentErrors {
  const errors: SogpEnrollmentErrors = {};

  if (!input.name) errors.name = "Full name is required.";
  if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!PHONE_PATTERN.test(input.phone)) {
    errors.phone = "Enter a valid WhatsApp number.";
  }
  if (!input.country) errors.country = "Country is required.";
  if (input.reason.length > 1_000) {
    errors.reason = "Keep your response within 1,000 characters.";
  }

  return errors;
}
