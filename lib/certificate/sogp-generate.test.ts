import { expect, test } from "vitest";

import { generateSogpCertificatePdf } from "./sogp-generate";

test("generates a non-empty SOGP certificate PDF", async () => {
  const pdf = await generateSogpCertificatePdf({
    studentName: "Ada Grace",
    cohortTitle: "SOGP September 2026",
    issuedAt: "4 October 2026",
    verificationCode: "SOGP-ABC123",
  });
  expect(pdf.byteLength).toBeGreaterThan(1_000);
});
