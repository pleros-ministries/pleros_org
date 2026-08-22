import type { ContactSubmissionFieldErrors } from "./contact-submissions";

export type ContactSubmitActionState = {
  values: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    message: string;
  };
  errors: ContactSubmissionFieldErrors;
  formError: string | null;
};

export const INITIAL_CONTACT_SUBMIT_STATE: ContactSubmitActionState = {
  values: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    message: "",
  },
  errors: {},
  formError: null,
};
