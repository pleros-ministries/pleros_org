export type SchoolOfPurposeWaitlistValues = {
  name: string;
  phone: string;
};

export type SchoolOfPurposeWaitlistFieldErrors = Partial<
  Record<keyof SchoolOfPurposeWaitlistValues, string>
>;

const PHONE_PATTERN = /^[+\d][\d\s()-]{6,19}$/;

export function normalizeSchoolOfPurposeWaitlistInput(
  input: SchoolOfPurposeWaitlistValues,
): SchoolOfPurposeWaitlistValues {
  return {
    name: input.name.trim(),
    phone: input.phone.trim(),
  };
}

export function validateSchoolOfPurposeWaitlistInput(
  input: SchoolOfPurposeWaitlistValues,
): SchoolOfPurposeWaitlistFieldErrors {
  const errors: SchoolOfPurposeWaitlistFieldErrors = {};

  if (!input.name) {
    errors.name = "Name is required.";
  }

  if (!input.phone) {
    errors.phone = "WhatsApp number is required.";
  } else if (!PHONE_PATTERN.test(input.phone)) {
    errors.phone = "Enter a valid WhatsApp number.";
  }

  return errors;
}
