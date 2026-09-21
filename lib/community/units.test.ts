import { describe, expect, test } from "vitest";

import {
  NIGERIA_STATE_LABELS,
  buildUnitName,
  canonicalRegionKey,
} from "./units";

describe("canonicalRegionKey", () => {
  test("matches canonical Nigerian states regardless of casing / 'state' suffix", () => {
    expect(canonicalRegionKey("NG", "Lagos")).toBe("lagos");
    expect(canonicalRegionKey("NG", "  oyo state ")).toBe("oyo");
    expect(canonicalRegionKey("ng", "Cross River")).toBe("cross-river");
    expect(canonicalRegionKey("NG", "Osun/Ogun")).toBe("osun");
  });

  test("resolves common aliases and cities to their state", () => {
    expect(canonicalRegionKey("NG", "Abuja")).toBe("fct");
    expect(canonicalRegionKey("NG", "FCT (Abuja)")).toBe("fct");
    expect(canonicalRegionKey("NG", "Ibadan")).toBe("oyo");
    expect(canonicalRegionKey("NG", "Port Harcourt")).toBe("rivers");
  });

  test("returns null for unknown regions and non-Nigeria countries", () => {
    expect(canonicalRegionKey("NG", "Nowhereville")).toBeNull();
    expect(canonicalRegionKey("NG", "")).toBeNull();
    expect(canonicalRegionKey("NG", null)).toBeNull();
    expect(canonicalRegionKey("GH", "Greater Accra")).toBeNull();
  });

  test("every enrolment-selector label canonicalises to a known key", () => {
    for (const label of NIGERIA_STATE_LABELS) {
      expect(canonicalRegionKey("NG", label)).not.toBeNull();
    }
  });
});

describe("buildUnitName", () => {
  test("names country-level and state-level units", () => {
    expect(buildUnitName("NG", null)).toBe("Nigeria");
    expect(buildUnitName("NG", "lagos")).toBe("Lagos, Nigeria");
    expect(buildUnitName("NG", "cross-river")).toBe("Cross River, Nigeria");
    expect(buildUnitName("NG", "fct")).toBe("FCT, Nigeria");
  });
});
