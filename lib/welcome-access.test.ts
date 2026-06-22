import { describe, expect, test } from "vitest";

import {
  createWelcomeAccessToken,
  parseWelcomeAccessToken,
  resolveWelcomeAccessName,
  WELCOME_ACCESS_MAX_AGE,
} from "./welcome-access";

describe("welcome access", () => {
  test("creates and parses a signed welcome access token", () => {
    const secret = "test-secret";
    const token = createWelcomeAccessToken(
      {
        email: "hello@pleros.org",
        name: "Hello Pleros",
      },
      secret,
    );

    expect(parseWelcomeAccessToken(token, secret)).toEqual({
      email: "hello@pleros.org",
      name: "Hello Pleros",
    });
  });

  test("rejects a token if the signature is changed", () => {
    const secret = "test-secret";
    const token = createWelcomeAccessToken(
      {
        email: "hello@pleros.org",
        name: "Hello Pleros",
      },
      secret,
    );

    const [payload, signature] = token.split(".");
    const tamperedSignature = `${signature?.slice(0, -1) ?? ""}x`;

    expect(parseWelcomeAccessToken(`${payload}.${tamperedSignature}`, secret)).toBeNull();
  });

  test("derives a readable default name from the email address", () => {
    expect(resolveWelcomeAccessName("grace.and-peace@pleros.org")).toBe(
      "Grace And Peace",
    );
    expect(resolveWelcomeAccessName("@pleros.org")).toBe("Pleros Guest");
  });

  test("keeps welcome access available for one hundred days", () => {
    expect(WELCOME_ACCESS_MAX_AGE).toBe(60 * 60 * 24 * 100);
  });
});
