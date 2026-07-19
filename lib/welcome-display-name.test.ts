import { describe, expect, test } from "vitest";

import {
  isEmailDerivedWelcomeName,
  resolveWelcomeDisplayName,
} from "./welcome-display-name";

describe("welcome display name", () => {
  test("rejects names derived from the email identifier", () => {
    expect(isEmailDerivedWelcomeName("hello@example.com", "hello@example.com")).toBe(
      true,
    );
    expect(isEmailDerivedWelcomeName("hello", "hello@example.com")).toBe(true);
    expect(isEmailDerivedWelcomeName("Adeyemodaniel10", "adeyemodaniel10@gmail.com")).toBe(
      true,
    );
  });

  test("prefers a stored lead name over stale cookie and session names", () => {
    expect(
      resolveWelcomeDisplayName({
        email: "adeyemodaniel10@gmail.com",
        leadName: "Daniel",
        welcomeName: "Adeyemodaniel10",
        sessionName: "adeyemodaniel10@gmail.com",
      }),
    ).toBe("Daniel");
  });

  test("falls back to the generic dashboard greeting when every name is email-derived", () => {
    expect(
      resolveWelcomeDisplayName({
        email: "adeyemodaniel10@gmail.com",
        leadName: "Adeyemodaniel10",
        welcomeName: "Adeyemodaniel10",
        sessionName: "adeyemodaniel10@gmail.com",
      }),
    ).toBeNull();
  });
});
