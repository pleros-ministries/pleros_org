export const WELCOME_ACCESS_COOKIE_NAME = "pleros_welcome_access";
export const WELCOME_ACCESS_MAX_AGE = 60 * 60 * 24 * 100;

export function getWelcomeAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WELCOME_ACCESS_MAX_AGE,
  };
}
