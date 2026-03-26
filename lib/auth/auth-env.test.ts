import { describe, expect, test } from "vitest";

import {
  buildTrustedOrigins,
  resolveAuthBaseUrl,
} from "./auth-env";

describe("auth environment helpers", () => {
  test("uses localhost in development when BETTER_AUTH_URL points at production", () => {
    expect(
      resolveAuthBaseUrl({
        NODE_ENV: "development",
        BETTER_AUTH_URL: "https://pleros-org.vercel.app",
      }),
    ).toBe("http://localhost:3000");
  });

  test("respects an explicit localhost app url in development", () => {
    expect(
      resolveAuthBaseUrl({
        NODE_ENV: "development",
        NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
        BETTER_AUTH_URL: "https://pleros-org.vercel.app",
      }),
    ).toBe("http://127.0.0.1:3000");
  });

  test("keeps the configured Better Auth url in production", () => {
    expect(
      resolveAuthBaseUrl({
        NODE_ENV: "production",
        BETTER_AUTH_URL: "https://ppc.pleros.org",
      }),
    ).toBe("https://ppc.pleros.org");
  });

  test("adds loopback origins in development for local auth flows", () => {
    expect(
      buildTrustedOrigins({
        NODE_ENV: "development",
        BETTER_AUTH_URL: "https://pleros-org.vercel.app",
      }),
    ).toEqual([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://ppc.pleros.org",
      "https://pleros-org.vercel.app",
    ]);
  });
});
