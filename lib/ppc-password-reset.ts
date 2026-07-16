export const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists for that email, a reset link has been sent.";

export type PasswordResetRequestState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: {
    email: string;
  };
  errors: {
    email?: string;
  };
};

export type PasswordResetState = {
  status: "idle" | "success" | "error";
  message: string | null;
  errors: {
    password?: string;
    token?: string;
  };
};

export const INITIAL_PASSWORD_RESET_REQUEST_STATE: PasswordResetRequestState = {
  status: "idle",
  message: null,
  values: {
    email: "",
  },
  errors: {},
};

export const INITIAL_PASSWORD_RESET_STATE: PasswordResetState = {
  status: "idle",
  message: null,
  errors: {},
};
