import { isAppRole, type AppRole } from "./app-role";

export const DEMO_AUTH_COOKIE_NAME = "ppc_demo_session";

export type DemoAuthSession = {
  user: {
    name: string;
    email: string;
    role: AppRole;
  };
};

export function isDemoAuthEnabled(): boolean {
  return process.env.DEMO_AUTH !== "false";
}

export function isValidAppRole(value: string): value is AppRole {
  return isAppRole(value);
}

export function encodeDemoSession(session: DemoAuthSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeDemoSession(raw: string | undefined | null): DemoAuthSession | null {
  if (!raw) {
    return null;
  }

  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<DemoAuthSession>;

    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.user &&
      typeof parsed.user.name === "string" &&
      typeof parsed.user.email === "string" &&
      typeof parsed.user.role === "string" &&
      isValidAppRole(parsed.user.role)
    ) {
      return {
        user: {
          name: parsed.user.name,
          email: parsed.user.email,
          role: parsed.user.role,
        },
      };
    }

    return null;
  } catch {
    return null;
  }
}
