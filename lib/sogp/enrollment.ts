import {
  isSupportedCountry,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

export type SogpEnrollmentValues = {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  region: string;
  reason: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
};

export type SogpEnrollmentInput = Partial<SogpEnrollmentValues> & {
  phoneCountryCode?: string;
};
export type SogpEnrollmentErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "countryCode"
    | "country"
    | "region"
    | "reason",
    string
  >
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function buildSogpEnrollmentRedirect(input: {
  cohortChannelUrl?: string | null;
  configuredChannelUrl?: string | null;
}) {
  const telegramUrl =
    input.cohortChannelUrl?.trim() || input.configuredChannelUrl?.trim();

  return telegramUrl
    ? {
        redirectTo: telegramUrl,
        telegramUrl,
      }
    : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeSogpEnrollment(
  input: SogpEnrollmentInput,
): SogpEnrollmentValues {
  const firstName = clean(input.firstName, 80);
  const lastName = clean(input.lastName, 80);
  const rawPhone = clean(input.phone, 32);
  const rawPhoneCountry = clean(input.phoneCountryCode, 2).toUpperCase();
  const phoneCountryCode = isSupportedCountry(rawPhoneCountry)
    ? (rawPhoneCountry as CountryCode)
    : undefined;
  let phone = rawPhone;
  const parsedPhone = rawPhone
    ? parsePhoneNumberFromString(rawPhone, phoneCountryCode)
    : undefined;
  if (parsedPhone?.isValid()) {
    phone = parsedPhone.number;
  }

  return {
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" "),
    email: clean(input.email, 320).toLowerCase(),
    phone,
    countryCode: clean(input.countryCode, 2).toUpperCase(),
    country: clean(input.country, 100),
    region: clean(input.region, 120),
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

  if (!input.firstName) errors.firstName = "First name is required.";
  if (!input.lastName) errors.lastName = "Last name is required.";
  if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!input.phone || !isValidPhoneNumber(input.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!input.countryCode) errors.countryCode = "Country is required.";
  if (!input.country) errors.country = "Country is required.";
  if (!input.region) {
    errors.region = "State, province or region is required.";
  }
  if (input.reason.length > 1_000) {
    errors.reason = "Keep your response within 1,000 characters.";
  }

  return errors;
}
