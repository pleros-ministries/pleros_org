import { describe, expect, test } from "vitest";

import {
  getSogpCountry,
  resolveSogpCountryCode,
  SOGP_COUNTRIES,
} from "./countries";

describe("SOGP country options", () => {
  test("uses a supported IP country and falls back to Nigeria", () => {
    expect(resolveSogpCountryCode(" gb ")).toBe("GB");
    expect(resolveSogpCountryCode("unknown")).toBe("NG");
    expect(resolveSogpCountryCode(null)).toBe("NG");
  });

  test("provides sorted country labels for enrolment", () => {
    expect(getSogpCountry("NG")?.label).toBe("Nigeria");
    expect(SOGP_COUNTRIES.length).toBeGreaterThan(200);
    expect(SOGP_COUNTRIES.map((item) => item.label)).toEqual(
      [...SOGP_COUNTRIES.map((item) => item.label)].sort((left, right) =>
        left.localeCompare(right, "en-GB"),
      ),
    );
  });
});
