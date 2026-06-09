import { validateEmail } from "./welcome-flow";

export const CONTACT_SUBMISSION_MINIMUM_DURATION_MS = 3000;

export type ContactSubmissionStatus = "new" | "read" | "resolved";

export type ContactSubmissionValues = {
  fullName: string;
  email: string;
  phone: string;
  location: string | null;
  message: string;
};

export type ContactSubmissionFieldErrors = Partial<
  Record<keyof ContactSubmissionValues, string>
>;

export type ContactSpamReason =
  | "honeypot"
  | "submitted_too_fast"
  | "invalid_form_start";

export type ContactSpamAudit = {
  isSpam: boolean;
  reasons: ContactSpamReason[];
  honeypotValue: string | null;
  formStartedAt: Date | null;
  submitDurationMs: number | null;
  blockSubmission: boolean;
};

export function normalizeContactSubmissionInput(
  input: ContactSubmissionValues,
): ContactSubmissionValues {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const location = input.location?.trim() ?? "";
  const message = input.message.trim();

  return {
    fullName,
    email,
    phone,
    location: location.length > 0 ? location : null,
    message,
  };
}

export function validateContactSubmissionInput(
  input: ContactSubmissionValues,
): ContactSubmissionFieldErrors {
  const errors: ContactSubmissionFieldErrors = {};

  if (!input.fullName) {
    errors.fullName = "Full name is required.";
  }

  if (!input.email) {
    errors.email = "Email is required.";
  } else if (!validateEmail(input.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.phone) {
    errors.phone = "Phone is required.";
  }

  if (!input.message) {
    errors.message = "Message is required.";
  }

  return errors;
}

function parseStartedAt(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return new Date(parsed);
}

export function evaluateContactSpam(
  input: {
    honeypot: string | undefined;
    formStartedAt: string | undefined;
  },
  options?: {
    nowMs?: number;
    minimumDurationMs?: number;
  },
): ContactSpamAudit {
  const nowMs = options?.nowMs ?? Date.now();
  const minimumDurationMs =
    options?.minimumDurationMs ?? CONTACT_SUBMISSION_MINIMUM_DURATION_MS;
  const startedAt = parseStartedAt(input.formStartedAt);
  const honeypotValue = input.honeypot?.trim() || null;
  const reasons: ContactSpamReason[] = [];

  if (honeypotValue) {
    reasons.push("honeypot");
  }

  let submitDurationMs: number | null = null;

  if (!startedAt) {
    reasons.push("invalid_form_start");
  } else {
    submitDurationMs = Math.max(0, nowMs - startedAt.getTime());
    if (submitDurationMs < minimumDurationMs) {
      reasons.push("submitted_too_fast");
    }
  }

  return {
    isSpam: reasons.length > 0,
    reasons,
    honeypotValue,
    formStartedAt: startedAt,
    submitDurationMs,
    blockSubmission: reasons.length > 0,
  };
}

export function buildContactStatusUpdate(
  current: {
    status: ContactSubmissionStatus;
    readAt: Date | null;
    resolvedAt: Date | null;
  },
  nextStatus: ContactSubmissionStatus,
  now = new Date(),
) {
  if (nextStatus === "new") {
    return {
      status: nextStatus,
      updatedAt: now,
      readAt: null,
      resolvedAt: null,
    };
  }

  if (nextStatus === "read") {
    return {
      status: nextStatus,
      updatedAt: now,
      readAt: current.readAt ?? now,
      resolvedAt: null,
    };
  }

  return {
    status: nextStatus,
    updatedAt: now,
    readAt: current.readAt ?? now,
    resolvedAt: current.resolvedAt ?? now,
  };
}

export function isContactSubmissionStatus(
  value: string,
): value is ContactSubmissionStatus {
  return value === "new" || value === "read" || value === "resolved";
}

export function getContactStatusVariant(
  status: ContactSubmissionStatus,
  isSpam: boolean,
): "default" | "warning" | "success" | "danger" {
  if (isSpam) {
    return "danger";
  }

  if (status === "resolved") {
    return "success";
  }

  if (status === "read") {
    return "warning";
  }

  return "default";
}
