import { expect, it } from "vitest";
import { emptyDraft, withKind } from "@/lib/community/activity-form";
import { MINISTRY_FIELDS } from "@/lib/community/ministry-report";
import { buildDemoState } from "./fixtures";
import { dayReport } from "./daily-report";
import { coverage } from "./scope";
import { saveActivity } from "./store";

it("keeps recorded numbers numeric when activities also hold follow-up interactions", () => {
  const today = "2026-10-09";
  const state = buildDemoState(today);
  const base = withKind(emptyDraft(today), "outreach");
  const result = saveActivity(state, {
    viewerId: "w-tolu",
    draft: {
      ...base,
      mode: "online",
      platform: "tiktok",
      numbers: { ...base.numbers, reachedOnline: "25", followUps: "3" },
    },
  });
  if (!result.ok) throw new Error(result.error);
  expect(dayReport(result.state, "w-tolu", today).numbers.followUps).toBe(3);
  const totals = coverage(result.state, ["w-tolu", "w-sade", "w-emeka"], today);
  for (const field of MINISTRY_FIELDS) {
    expect(typeof totals.numbers[field.key]).toBe("number");
    expect(Number.isFinite(totals.numbers[field.key])).toBe(true);
  }
  for (const row of result.state.activities) {
    for (const field of MINISTRY_FIELDS) expect(typeof row[field.key]).toBe("number");
  }
});
