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
  birthYear: string;
  referralSource: string;
  whatsappConsent: boolean | null;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
};

export type SogpEnrollmentInput = Omit<
  Partial<SogpEnrollmentValues>,
  "whatsappConsent"
> & {
  phoneCountryCode?: string;
  whatsappConsent?: boolean | "" | "yes" | "no" | null;
};
export type SogpEnrollmentErrors = Partial<
  Record<
    | "name"
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "countryCode"
    | "country"
    | "region"
    | "birthYear"
    | "referralSource"
    | "whatsappConsent",
    string
  >
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EARLIEST_BIRTH_YEAR = 1900;
/** SOGP is open to teenagers upwards, so anything younger reads as a typo. */
const MINIMUM_AGE = 10;

export const SOGP_REFERRAL_OPTIONS = [
  { value: "friend_or_family", label: "Friend or family member" },
  { value: "church_or_pastor", label: "Church, pastor or minister" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "social_media", label: "Social media" },
  { value: "pleros_website", label: "Pleros website" },
  { value: "pleros_event", label: "Pleros programme or event" },
  { value: "search_engine", label: "Search engine" },
  { value: "other", label: "Other" },
] as const;

const SOGP_REFERRAL_VALUES = new Set<string>(
  SOGP_REFERRAL_OPTIONS.map((option) => option.value),
);

export function getSogpBirthYearOptions(
  currentYear = new Date().getUTCFullYear(),
) {
  return Array.from(
    { length: currentYear - MINIMUM_AGE - EARLIEST_BIRTH_YEAR + 1 },
    (_, index) => String(currentYear - MINIMUM_AGE - index),
  );
}

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

function normalizeWhatsappConsent(
  value: SogpEnrollmentInput["whatsappConsent"],
): boolean | null {
  if (value === true || value === "yes") return true;
  if (value === false || value === "no") return false;
  return null;
}

export function normalizeSogpEnrollment(
  input: SogpEnrollmentInput,
): SogpEnrollmentValues {
  const firstName = clean(input.firstName, 80);
  const lastName = clean(input.lastName, 80);
  const name = [firstName, lastName].filter(Boolean).join(" ");
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
    name,
    email: clean(input.email, 320).toLowerCase(),
    phone,
    countryCode: clean(input.countryCode, 2).toUpperCase(),
    country: clean(input.country, 100),
    region: clean(input.region, 120),
    birthYear: clean(input.birthYear, 4).replace(/\D/g, ""),
    referralSource: clean(input.referralSource, 80),
    whatsappConsent: normalizeWhatsappConsent(input.whatsappConsent),
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

  if (!input.firstName) errors.firstName = "Enter your first name.";
  if (!input.lastName) errors.lastName = "Enter your surname.";
  if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!input.phone || !isValidPhoneNumber(input.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!input.countryCode) errors.countryCode = "Country is required.";
  if (!input.country) errors.country = "Country is required.";
  if (!input.region) {
    errors.region = "State, province or region of residence is required.";
  }
  const birthYear = Number(input.birthYear);
  const latestBirthYear = new Date().getUTCFullYear() - MINIMUM_AGE;
  if (!input.birthYear) {
    errors.birthYear = "Year of birth is required.";
  } else if (
    !Number.isInteger(birthYear) ||
    birthYear < EARLIEST_BIRTH_YEAR ||
    birthYear > latestBirthYear
  ) {
    errors.birthYear = `Enter a year between ${EARLIEST_BIRTH_YEAR} and ${latestBirthYear}.`;
  }
  if (!SOGP_REFERRAL_VALUES.has(input.referralSource)) {
    errors.referralSource = "Select how you heard about us.";
  }
  if (input.whatsappConsent === null) {
    errors.whatsappConsent = "Select whether you want WhatsApp reminders.";
  }

  return errors;
}
