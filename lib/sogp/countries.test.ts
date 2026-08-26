import { describe, expect, test } from "vitest";

import {
  countryCodeToFlag,
  getSogpCountry,
  matchesSogpCountryQuery,
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

  test("carries a dial code and flag for the picker", () => {
    const nigeria = getSogpCountry("NG")!;
    expect(nigeria.callingCode).toBe("234");
    expect(nigeria.flag).toBe(countryCodeToFlag("NG"));
  });

  test("searches by name, code and dial code at word boundaries", () => {
    const codesFor = (query: string) =>
      SOGP_COUNTRIES.filter((country) =>
        matchesSogpCountryQuery(country, query),
      ).map((country) => country.code);

    expect(codesFor("ghan")).toEqual(["GH"]);
    expect(codesFor("+233")).toEqual(["GH"]);
    expect(codesFor("233")).toEqual(["GH"]);
    expect(codesFor("united king")).toEqual(["GB"]);
    expect(codesFor("cote d'ivoire")).toEqual(["CI"]);
    expect(codesFor("")).toHaveLength(SOGP_COUNTRIES.length);
  });
});
