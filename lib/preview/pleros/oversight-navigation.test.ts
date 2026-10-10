import { expect, it } from "vitest";
import { buildDemoState } from "./fixtures";
import { groupOversightRows, oversightRows, resolveOversightScope, scopeIds } from "./scope";

const state = buildDemoState("2026-10-09");

it("narrows an authorized viewer's scope without changing their identity", () => {
  expect(resolveOversightScope(state, "p-ife", "p-kunle")?.id).toBe("p-kunle");
  expect(resolveOversightScope(state, "p-kunle", "u-chioma")?.id).toBe("u-chioma");
  expect(resolveOversightScope(state, "u-chioma", "p-kunle")).toBeNull();
  expect(resolveOversightScope(state, "p-kunle", "p-ngozi")).toBeNull();
  expect(resolveOversightScope(state, "p-kunle", "missing")).toBeNull();
  expect(resolveOversightScope(state, "p-kunle", null)?.id).toBe("p-kunle");
});

it("groups each authorized row once under its nearest unit leader", () => {
  const rows = oversightRows(state, "p-ife", scopeIds(state, "p-ife"), state.today);
  const groups = groupOversightRows(state, rows);
  expect(groups.find((group) => group.leader?.id === "u-chioma")?.rows.map((row) => row.person.id))
    .toEqual(["u-chioma", "w-tolu", "w-sade", "w-emeka"]);
  const ids = groups.flatMap((group) => group.rows.map((row) => row.person.id));
  expect(new Set(ids).size).toBe(rows.length);
  expect(ids.length).toBe(rows.length);
  expect(groups.find((group) => group.id === "leadership")?.rows.map((row) => row.person.id))
    .toEqual(["p-kunle", "p-ngozi"]);
});
