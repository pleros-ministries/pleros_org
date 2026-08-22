import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  buildWelcomeAuthPassword,
  normalizeWelcomeReturnTo,
  provisionWelcomeSession,
} from "./welcome-session";

const signUpEmail = vi.fn();
const signInEmail = vi.fn();
const ensureAppUserRecord = vi.fn();
const findUserByEmail = vi.fn();
const createSession = vi.fn();
const setCookie = vi.fn();

vi.mock("./auth/better-auth", () => ({
  betterAuthServer: {
    api: {
      signUpEmail,
      signInEmail,
    },
    $context: Promise.resolve({
      secret: "test-secret",
      authCookies: {
        sessionToken: {
          name: "better-auth.session_token",
          attributes: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            path: "/",
            maxAge: 60 * 60,
          },
        },
      },
      internalAdapter: {
        findUserByEmail,
        createSession,
      },
    }),
  },
}));

vi.mock("./app-user", () => ({
  ensureAppUserRecord,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: setCookie,
  }),
}));

describe("welcome session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("builds a deterministic password for the same email and secret", () => {
    expect(
      buildWelcomeAuthPassword("hello@example.com", "secret-one"),
    ).toBe(buildWelcomeAuthPassword("hello@example.com", "secret-one"));
  });

  test("builds a different password when the email changes", () => {
    expect(
      buildWelcomeAuthPassword("hello@example.com", "secret-one"),
    ).not.toBe(buildWelcomeAuthPassword("team@example.com", "secret-one"));
  });

  test("limits the return target to an internal path", () => {
    expect(normalizeWelcomeReturnTo("/dashboard")).toBe("/dashboard");
    expect(normalizeWelcomeReturnTo("/ppc/student")).toBe("/ppc/student");
    expect(normalizeWelcomeReturnTo("https://example.com")).toBe("/dashboard");
    expect(normalizeWelcomeReturnTo("//evil.test")).toBe("/dashboard");
    expect(normalizeWelcomeReturnTo("dashboard")).toBe("/dashboard");
    expect(normalizeWelcomeReturnTo(undefined)).toBe("/dashboard");
  });

  test("creates a direct session for an existing auth user when password login is unavailable", async () => {
    signUpEmail.mockRejectedValueOnce(new Error("user exists"));
    signInEmail.mockRejectedValueOnce(new Error("wrong password"));
    findUserByEmail.mockResolvedValueOnce({
      user: {
        id: "user-123",
        name: "Existing Person",
        email: "existing@example.com",
      },
    });
    createSession.mockResolvedValueOnce({
      token: "session-token-123",
    });

    await expect(
      provisionWelcomeSession({
        email: "existing@example.com",
        name: "Existing Person",
      }),
    ).resolves.toEqual({
      id: "user-123",
      name: "Existing Person",
      email: "existing@example.com",
    });

    expect(createSession).toHaveBeenCalledWith("user-123");
    expect(ensureAppUserRecord).toHaveBeenCalledWith({
      id: "user-123",
      name: "Existing Person",
      email: "existing@example.com",
    });
    expect(setCookie).toHaveBeenCalledTimes(1);
  });
});
