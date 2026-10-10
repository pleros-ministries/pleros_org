import { expect, it } from "vitest";
import { buildDemoState } from "./fixtures";
import { oversightReport } from "./oversight-report";

const state = buildDemoState("2026-10-09");
it("opens a directly overseen unit leader's individual report, excluding notes and contacts", () => {
  const report = oversightReport(state, "p-kunle", "u-chioma", state.today);
  expect(report).not.toBeNull();
  expect(report!.ministry).toHaveLength(state.activities.filter((activity) => activity.personId === "u-chioma" && activity.activityDate === state.today && activity.kind === "outreach").length);
  for (const activity of [...report!.ministry, ...report!.meetings]) {
    expect(activity).not.toHaveProperty("note");
    expect(activity).not.toHaveProperty("contactIds");
    expect(activity).not.toHaveProperty("followUpPeople");
  }
});
it("keeps unit leaders status-only and refuses access across branches", () => {
  expect(oversightReport(state, "u-chioma", "w-tolu", state.today)).toBeNull();
  expect(oversightReport(state, "p-kunle", "u-amina", state.today)).toBeNull();
  expect(oversightReport(state, "w-tolu", "u-chioma", state.today)).toBeNull();
});
