import type { AppRole } from "./app-role";

type PortalKind = "student" | "staff";
type AuthIntent = "sign_in" | "sign_up";

export function getPostAuthRedirectPath(input: {
  resolvedRole: AppRole;
  returnTo?: string;
}) {
  if (input.resolvedRole === "student") {
    return input.returnTo?.startsWith("/ppc") ? input.returnTo : "/ppc";
  }

  return "/admin";
}

export function getPortalAccessNotice(
  requestedPortal: PortalKind,
  resolvedRole: AppRole,
  intent: AuthIntent = "sign_in",
) {
  const afterAction = intent === "sign_up" ? "account setup" : "login";

  if (requestedPortal === "student") {
    if (resolvedRole === "student") {
      return null;
    }

    return {
      tone: "info" as const,
      message: `This email is configured for staff access. After ${afterAction}, you'll be sent to /admin.`,
    };
  }

  if (resolvedRole === "student") {
    return {
      tone: "warning" as const,
      message:
        "This email is not configured for staff access. It will open in the student portal at /ppc.",
    };
  }

  return {
    tone: "default" as const,
    message:
      resolvedRole === "admin"
        ? "This email is configured for administrator access."
        : "This email is configured for instructor access.",
  };
}

export function formatAuthErrorMessage(
  rawMessage: string | null | undefined,
  intent: AuthIntent,
) {
  const message = rawMessage?.trim().toLowerCase() ?? "";

  if (message.includes("invalid email or password")) {
    return "Email or password is incorrect.";
  }

  if (
    message.includes("user already exists") ||
    message.includes("already been taken") ||
    message.includes("already exists")
  ) {
    return "An account already exists for this email. Use login instead.";
  }

  if (message.includes("email not verified")) {
    return "Check your email for a verification link before signing in.";
  }

  if (message.includes("password") && message.includes("8")) {
    return "Password must be at least 8 characters.";
  }

  return intent === "sign_in" ? "Login failed." : "Account setup failed.";
}
