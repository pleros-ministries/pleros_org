import { fcchurchVisitorLocations } from "./fcchurch-page-content";
import { normalizeEmail, validateEmail } from "./welcome-flow";

export type FirstTimeWorshipperValues = {
  fullName: string;
  phone: string;
  email: string;
  location: string;
};

export type FirstTimeWorshipperErrors = Partial<
  Record<keyof FirstTimeWorshipperValues, string>
>;

export type FirstTimeWorshipperSubmitState = {
  values: FirstTimeWorshipperValues;
  errors: FirstTimeWorshipperErrors;
  formError: string | null;
};

export const INITIAL_FIRST_TIME_WORSHIPPER_SUBMIT_STATE: FirstTimeWorshipperSubmitState = {
  values: {
    fullName: "",
    phone: "",
    email: "",
    location: "",
  },
  errors: {},
  formError: null,
};

export function normalizeFirstTimeWorshipperInput(
  values: FirstTimeWorshipperValues,
): FirstTimeWorshipperValues {
  return {
    fullName: values.fullName.trim(),
    phone: values.phone.trim(),
    email: normalizeEmail(values.email),
    location: values.location.trim(),
  };
}

export function validateFirstTimeWorshipperInput(
  values: FirstTimeWorshipperValues,
): FirstTimeWorshipperErrors {
  const errors: FirstTimeWorshipperErrors = {};

  if (!values.fullName) {
    errors.fullName = "Full name is required.";
  }

  if (!values.phone) {
    errors.phone = "Phone number is required.";
  }

  if (!values.email) {
    errors.email = "Email is required.";
  } else if (!validateEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!fcchurchVisitorLocations.some((location) => location.value === values.location)) {
    errors.location = "Choose one of our church locations.";
  }

  return errors;
}

export function getFirstTimeWorshipperSheetName(location: string): string | null {
  return (
    fcchurchVisitorLocations.find((item) => item.value === location)?.sheetName ??
    null
  );
}
