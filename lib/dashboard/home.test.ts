import { expect, test } from "vitest";
import { homeReportRows } from "./home";

test("canonical devotional facts never manufacture a confirmation", () => {
  const rows = homeReportRows({ devotionalCount: 3, ministryCount: 0, meetingCount: 1, declarations: [{ category: "ministry", declaration: "nil" }] });
  expect(rows.map(row => row.status)).toEqual(["Not confirmed", "Nil declared", "Reported"]);
  expect(rows.map(row => row.tone)).toEqual(["amber", "neutral", "green"]);
});
test("missing reports remain different from explicit Nil, including disabled declaration reads", () => {
  expect(homeReportRows({ devotionalCount: 0, ministryCount: 0, meetingCount: 0, declarations: [] }).map(row => row.status)).toEqual(["Not reported", "Not reported", "Not reported"]);
});
test("confirmation of an empty devotional day does not invent a Nil declaration", () => {
  const row = homeReportRows({ devotionalCount: 0, ministryCount: 0, meetingCount: 0, declarations: [{ category: "devotional", declaration: "confirmed" }] })[0];
  expect(row.status).toBe("Confirmed");
  expect(row.description).toBe("No activity logged");
});
