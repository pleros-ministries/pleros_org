import { describe, expect, test } from "vitest";

import {
  decodeDemoSession,
  encodeDemoSession,
  isValidAppRole,
  type DemoAuthSession,
} from "./demo-auth-session";

describe("demo auth session", () => {
  test("role guard validates known roles", () => {
    expect(isValidAppRole("admin")).toBe(true);
    expect(isValidAppRole("instructor")).toBe(true);
    expect(isValidAppRole("student")).toBe(true);
    expect(isValidAppRole("unknown")).toBe(false);
  });

  test("roundtrip encode/decode preserves session payload", () => {
    const payload: DemoAuthSession = {
      user: {
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
      },
    };

    const encoded = encodeDemoSession(payload);
    const decoded = decodeDemoSession(encoded);

    expect(decoded).toEqual(payload);
  });

  test("decode returns null for invalid content", () => {
    expect(decodeDemoSession("bad")).toBeNull();
  });
});
