import { describe, expect, it } from "vitest";

import { formatGiftAmount, parseGiftAmount, validateGiftInput, yearTotals } from "./partner-gifts";

describe("parseGiftAmount", () => {
  it("reads whole and decimal amounts with separators", () => {
    expect(parseGiftAmount("5000")).toBe(500000);
    expect(parseGiftAmount("5,000.5")).toBe(500050);
    expect(parseGiftAmount(" ₦10,000.25 ")).toBe(1000025);
  });
  it("rejects zero, negatives, three decimals and words", () => {
    for (const bad of ["", "0", "-5", "1.234", "five", "1e5"]) expect(parseGiftAmount(bad)).toBeNull();
  });
});

describe("formatGiftAmount", () => {
  it("drops decimals for whole amounts", () => {
    expect(formatGiftAmount(500000, "NGN")).toBe("₦5,000");
    expect(formatGiftAmount(2550, "USD")).toBe("$25.50");
  });
});

describe("validateGiftInput", () => {
  const base = { amount: "5000", currency: "NGN", channel: "bank", givenOn: "2026-11-10" };
  it("accepts a valid gift and trims the note", () => {
    expect(validateGiftInput({ ...base, note: "  Thanksgiving  " }, "2026-11-10")).toEqual({
      ok: true, gift: { amountMinor: 500000, currency: "NGN", channel: "bank", givenOn: "2026-11-10", note: "Thanksgiving" },
    });
  });
  it("allows a day of leeway for time zones, not more", () => {
    expect(validateGiftInput({ ...base, givenOn: "2026-11-11" }, "2026-11-10").ok).toBe(true);
    expect(validateGiftInput({ ...base, givenOn: "2026-11-12" }, "2026-11-10").ok).toBe(false);
  });
  it("rejects unknown currencies and channels", () => {
    expect(validateGiftInput({ ...base, currency: "GBP" }, "2026-11-10").ok).toBe(false);
    expect(validateGiftInput({ ...base, channel: "cheque" }, "2026-11-10").ok).toBe(false);
  });
  it("rejects long notes", () => {
    expect(validateGiftInput({ ...base, note: "x".repeat(281) }, "2026-11-10").ok).toBe(false);
  });
});

describe("yearTotals", () => {
  const gifts = [
    { id: 1, amountMinor: 100, currency: "NGN" as const, givenOn: "2026-01-02" },
    { id: 3, amountMinor: 200, currency: "USD" as const, givenOn: "2026-05-01" },
    { id: 2, amountMinor: 300, currency: "NGN" as const, givenOn: "2026-05-01" },
    { id: 4, amountMinor: 900, currency: "NGN" as const, givenOn: "2025-12-31" },
  ];
  it("totals this year per currency", () => {
    expect(yearTotals(gifts, "2026-11-10")).toEqual([
      { currency: "NGN", amountMinor: 400 }, { currency: "USD", amountMinor: 200 },
    ]);
  });
});
