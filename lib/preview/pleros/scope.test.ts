import { describe, expect, it } from "vitest";

import { buildDemoState } from "./fixtures";
import {
  contactsFor,
  coverage,
  discipleIds,
  oversightRow,
  oversees,
  responsibilities,
  scopeBranches,
  scopeIds,
  supervisorChain,
} from "./scope";

const TODAY = "2026-10-09";

describe("organisational scope", () => {
  const state = buildDemoState(TODAY);

  it("walks every level below the pastor once", () => {
    const ids = scopeIds(state, "p-ife");
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain("p-ife");
    // Disciples are not part of the organisation.
    expect(ids.some((id) => id.startsWith("d-"))).toBe(false);
  });

  it("stops on a cycle instead of counting forever", () => {
    const looped = {
      ...state,
      people: state.people.map((person) =>
        person.id === "p-ife" ? { ...person, supervisorId: "w-tolu" } : person,
      ),
    };
    const ids = scopeIds(looped, "u-chioma");
    expect(new Set(ids).size).toBe(ids.length);
    expect(supervisorChain(looped, "w-tolu").map((person) => person.id)).toEqual([
      "u-chioma",
      "p-kunle",
      "p-ife",
    ]);
  });

  it("gives workers no oversight and leaders only their own branch", () => {
    expect(scopeIds(state, "w-tolu")).toEqual([]);
    expect(oversees(state, "u-chioma", "w-tolu")).toBe(true);
    expect(oversees(state, "u-chioma", "w-bisi")).toBe(false);
    expect(oversees(state, "w-tolu", "u-chioma")).toBe(false);
    expect(oversees(state, "u-chioma", "u-chioma")).toBe(false);
  });

  it("counts unique people separately from role assignments and memberships", () => {
    // Chioma oversees Tolu, Sade and Emeka and disciples Blessing and Sade.
    const chioma = responsibilities(state, "u-chioma");
    expect(chioma.roleAssignments).toBe(3);
    expect(chioma.groupMemberships).toBe(2);
    expect(chioma.overlap).toBe(1);
    expect(chioma.uniquePeople).toBe(4);

    // The pastor disciples Ngozi, who is also in the pastor's organisation.
    const pastor = responsibilities(state, "p-ife");
    expect(pastor.roleAssignments).toBe(12);
    expect(pastor.disciples.sort()).toEqual(["d-ruth", "p-ngozi"]);
    expect(pastor.uniquePeople).toBe(13);
  });

  it("does not count a closed group's disciples", () => {
    expect(discipleIds(state, "u-chioma").sort()).toEqual(["d-blessing", "w-sade"]);
  });
});

describe("coverage roll-ups", () => {
  const state = buildDemoState(TODAY);

  it("deduplicates repeated ids and leaves disciples out of the expected roster", () => {
    const once = coverage(state, ["w-tolu", "w-sade"], TODAY);
    const twice = coverage(state, ["w-tolu", "w-sade", "w-sade", "d-grace"], TODAY);
    expect(twice).toEqual(once);
    expect(once.expected).toBe(2);
  });

  it("adds branches up to the whole scope without double counting", () => {
    const branches = scopeBranches(state, "p-ife", TODAY);
    const whole = coverage(state, scopeIds(state, "p-ife"), TODAY);
    expect(branches.map((branch) => branch.lead.id)).toEqual(["p-kunle", "p-ngozi"]);
    expect(branches.reduce((sum, branch) => sum + branch.coverage.expected, 0)).toBe(whole.expected);
    expect(
      branches.reduce((sum, branch) => sum + branch.coverage.overall.complete, 0),
    ).toBe(whole.overall.complete);
  });

  it("keeps recorded reach separate from people counts", () => {
    const whole = coverage(state, scopeIds(state, "p-ife"), TODAY);
    expect(whole.recordedReach).toBe(
      whole.numbers.reachedOnline + whole.numbers.reachedOffline + whole.numbers.attendance,
    );
    expect(whole.expected).toBe(12);
  });
});

describe("what a supervisor may see", () => {
  const state = buildDemoState(TODAY);

  it("returns nothing for people outside the viewer's scope", () => {
    expect(oversightRow(state, "u-chioma", "w-bisi", TODAY)).toBeNull();
    expect(oversightRow(state, "w-tolu", "w-sade", TODAY)).toBeNull();
  });

  it("carries statuses and sums, never notes, contacts or devotional detail", () => {
    const row = oversightRow(state, "p-ife", "w-tolu", TODAY)!;
    expect(row).not.toBeNull();
    const json = JSON.stringify(row);
    expect(json).not.toMatch(/"note"|"contactIds"|"followUpPeople"|"phone"|John/);
    for (const source of row.devotionSources) {
      expect(Object.keys(source).sort()).toEqual(["key", "label", "recorded"]);
    }
    expect(row.supervisorName).toBe("Chioma Obi");
  });

  it("never hands a member's contacts to anyone above them", () => {
    expect(contactsFor(state, "w-tolu").length).toBeGreaterThan(0);
    for (const viewer of ["u-chioma", "p-kunle", "p-ife"]) {
      expect(contactsFor(state, viewer).some((contact) => contact.ownerId === "w-tolu")).toBe(false);
    }
  });
});
