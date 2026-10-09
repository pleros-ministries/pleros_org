import { expect, test } from "vitest";

import {
  formatSogpCertificateDate,
  generateSogpCertificatePdf,
  generateSogpWeekCertificatePdf,
} from "./sogp-generate";

test("generates a non-empty SOGP certificate PDF", async () => {
  const pdf = await generateSogpCertificatePdf({
    studentName: "Ada Grace",
    cohortTitle: "SOGP September 2026",
    issuedAt: "4 October 2026",
    verificationCode: "SOGP-ABC123",
  });
  expect(pdf.byteLength).toBeGreaterThan(1_000);
});

test("generates a non-empty SOGP week certificate PDF", async () => {
  const pdf = await generateSogpWeekCertificatePdf({
    studentName: "Ada Grace",
    cohortTitle: "SOGP September 2026",
    issuedAt: "20 September 2026",
    verificationCode: "SOGP-W1-ABC123",
    week: 1,
    weekTitle: "Gospel foundations and the Spirit",
  });
  expect(pdf.byteLength).toBeGreaterThan(1_000);
});

test("prints issue dates in Lagos time", () => {
  // 23:30 UTC on 19 September is already 20 September in Lagos.
  expect(formatSogpCertificateDate(new Date("2026-09-19T23:30:00Z"))).toBe("20 September 2026");
});
