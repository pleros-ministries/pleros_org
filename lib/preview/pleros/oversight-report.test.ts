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
it("lets unit leaders read direct workers' details without notes or contacts", () => {
  const report = oversightReport(state, "u-chioma", "w-tolu", state.today);
  expect(report).not.toBeNull();
  for (const activity of [...report!.ministry, ...report!.meetings]) {
    expect(activity).not.toHaveProperty("note");
    expect(activity).not.toHaveProperty("contactIds");
    expect(activity).not.toHaveProperty("followUpPeople");
  }
  const indirect = structuredClone(state);
  const worker = indirect.people.find((person) => person.id === "w-tolu")!;
  worker.supervisorId = "u-femi";
  expect(oversightReport(indirect, "u-chioma", worker.id, state.today)).toBeNull();
  worker.supervisorId = "u-chioma";
  worker.tier = "disciple";
  expect(oversightReport(indirect, "u-chioma", worker.id, state.today)).toBeNull();
});
it("refuses access across branches and upward reporting access", () => {
  expect(oversightReport(state, "p-kunle", "u-amina", state.today)).toBeNull();
  expect(oversightReport(state, "w-tolu", "u-chioma", state.today)).toBeNull();
});
