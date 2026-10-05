import { describe, expect, test } from "vitest";

import {
  CONTACTS_PER_DAY_MAX,
  CONTACT_NAME_MAX,
  CONTACT_NOTE_MAX,
  FOLLOW_UP_NOTE_MAX,
  canSeeOutreachContact,
  filterAndSortContacts,
  normaliseContactInput,
  normaliseContactRows,
  normaliseFollowUpNote,
  phoneHref,
} from "./outreach-contacts";

describe("normaliseContactInput", () => {
  test("tidies the name and keeps phone and note optional", () => {
    expect(normaliseContactInput({ name: "  Chidi   Okafor " })).toEqual({
      ok: true,
      value: { name: "Chidi Okafor", phone: null, note: null },
    });
    expect(
      normaliseContactInput({
        name: "Ada",
        phone: " +234 803 555 0101 ",
        note: " Met at the market. ",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Ada",
        phone: "+234 803 555 0101",
        note: "Met at the market.",
      },
    });
  });

  test("a name is required and has a limit", () => {
    expect(normaliseContactInput({ name: " " }).ok).toBe(false);
    expect(normaliseContactInput({ name: "A" }).ok).toBe(false);
    expect(normaliseContactInput({}).ok).toBe(false);
    expect(
      normaliseContactInput({ name: "x".repeat(CONTACT_NAME_MAX + 1) }).ok,
    ).toBe(false);
  });

  test("rejects a phone number that could not be dialled", () => {
    const base = { name: "Ada" };
    expect(normaliseContactInput({ ...base, phone: "call me" }).ok).toBe(false);
    expect(normaliseContactInput({ ...base, phone: "12345" }).ok).toBe(false);
    expect(normaliseContactInput({ ...base, phone: "0803-555-0101" }).ok).toBe(true);
    expect(normaliseContactInput({ ...base, phone: "(0803) 555 0101" }).ok).toBe(
      false,
    );
    expect(normaliseContactInput({ ...base, phone: "0803 (555) 0101" }).ok).toBe(
      true,
    );
  });

  test("a long note is refused", () => {
    expect(
      normaliseContactInput({ name: "Ada", note: "x".repeat(CONTACT_NOTE_MAX + 1) })
        .ok,
    ).toBe(false);
  });
});

describe("normaliseFollowUpNote", () => {
  test("trims, empties to null and caps the length", () => {
    expect(normaliseFollowUpNote("  Called, will visit Sunday. ")).toBe(
      "Called, will visit Sunday.",
    );
    expect(normaliseFollowUpNote("   ")).toBeNull();
    expect(normaliseFollowUpNote(undefined)).toBeNull();
    expect(normaliseFollowUpNote("x".repeat(FOLLOW_UP_NOTE_MAX + 20))).toHaveLength(
      FOLLOW_UP_NOTE_MAX,
    );
  });
});

describe("phoneHref", () => {
  test("builds a dialable link and handles a missing number", () => {
    expect(phoneHref("+234 803 555 0101")).toBe("tel:+2348035550101");
    expect(phoneHref("0803-555-0101")).toBe("tel:08035550101");
    expect(phoneHref(null)).toBeNull();
  });
});

describe("canSeeOutreachContact", () => {
  const owner = { userId: "member_1", unitIds: [8] };
  const viewer = (overrides: Partial<{
    userId: string;
    isAdmin: boolean;
    managedUnitIds: number[];
  }>) => ({ userId: "someone", isAdmin: false, managedUnitIds: [], ...overrides });

  test("the member who met them and admins can see the person", () => {
    expect(canSeeOutreachContact(viewer({ userId: "member_1" }), owner)).toBe(true);
    expect(canSeeOutreachContact(viewer({ isAdmin: true }), owner)).toBe(true);
  });

  test("the pastor assigned to the member's group can, another pastor cannot", () => {
    expect(canSeeOutreachContact(viewer({ managedUnitIds: [8, 12] }), owner)).toBe(
      true,
    );
    expect(canSeeOutreachContact(viewer({ managedUnitIds: [12] }), owner)).toBe(false);
  });

  test("other learners, including a discipler, cannot", () => {
    expect(canSeeOutreachContact(viewer({}), owner)).toBe(false);
    expect(
      canSeeOutreachContact(viewer({ managedUnitIds: [8] }), {
        userId: "member_2",
        unitIds: [],
      }),
    ).toBe(false);
  });
});

describe("normaliseContactRows", () => {
  test("skips empty rows and keeps the id of a saved person", () => {
    expect(
      normaliseContactRows([
        { id: 7, name: " Ada ", phone: "0803 555 0101", note: "" },
        { name: "", phone: "  ", note: "" },
        { name: "Chidi", phone: "", note: "Wants a Bible" },
      ]),
    ).toEqual({
      ok: true,
      value: [
        { id: 7, name: "Ada", phone: "0803 555 0101", note: null },
        { id: null, name: "Chidi", phone: null, note: "Wants a Bible" },
      ],
    });
  });

  test("a saved person whose row was cleared is dropped, so they are removed", () => {
    expect(normaliseContactRows([{ id: 7, name: "", phone: "", note: "" }])).toEqual({
      ok: true,
      value: [],
    });
  });

  test("names the row an error came from, counting empty rows too", () => {
    expect(
      normaliseContactRows([
        { name: "Ada" },
        { name: "", phone: "", note: "" },
        { name: "", phone: "0803 555 0101" },
      ]),
    ).toEqual({ ok: false, error: "Person 3: Enter the person's name." });
  });

  test("ignores an id that is not a positive whole number", () => {
    const parsed = normaliseContactRows([
      { id: -3, name: "Ada" },
      { id: 2.5, name: "Chidi" },
    ]);
    expect(parsed.ok && parsed.value.map((person) => person.id)).toEqual([null, null]);
  });

  test("refuses more people than the daily limit", () => {
    const rows = Array.from({ length: CONTACTS_PER_DAY_MAX + 1 }, (_, index) => ({
      name: `Person ${index}`,
    }));
    expect(normaliseContactRows(rows).ok).toBe(false);
    expect(normaliseContactRows(rows.slice(0, CONTACTS_PER_DAY_MAX)).ok).toBe(true);
  });
});

describe("filterAndSortContacts", () => {
  const person = (
    id: number,
    name: string,
    metDate: string,
    extra: Partial<{
      phone: string | null;
      note: string | null;
      followedUpAt: string | null;
      memberName: string;
    }> = {},
  ) => ({
    id,
    name,
    metDate,
    phone: null,
    note: null,
    followedUpAt: null,
    ...extra,
  });

  const list = [
    person(1, "Chidi", "2026-10-03", { phone: "+234 803 555 0101", memberName: "Tolu" }),
    person(2, "Ada", "2026-10-05", {
      note: "Met at Ikeja market",
      followedUpAt: "2026-10-05T18:00:00.000Z",
      memberName: "Bisi",
    }),
    person(3, "Bola", "2026-10-05", { memberName: "Tolu" }),
  ];
  const ids = (rows: Array<{ id: number }>) => rows.map((row) => row.id);
  const run = (
    options: Partial<Parameters<typeof filterAndSortContacts>[1]> = {},
  ) =>
    ids(
      filterAndSortContacts(list, {
        query: "",
        status: "all",
        sort: "newest",
        ...options,
      }),
    );

  test("sorts newest first by default, then by the order they were added", () => {
    expect(run()).toEqual([3, 2, 1]);
    expect(run({ sort: "oldest" })).toEqual([1, 2, 3]);
  });

  test("sorts by name both ways", () => {
    expect(run({ sort: "name_asc" })).toEqual([2, 3, 1]);
    expect(run({ sort: "name_desc" })).toEqual([1, 3, 2]);
  });

  test("can put people still to follow up first", () => {
    expect(run({ sort: "pending_first" })).toEqual([3, 1, 2]);
  });

  test("staff can sort by the member who met them", () => {
    expect(run({ sort: "member" })).toEqual([2, 3, 1]);
  });

  test("filters by follow-up status", () => {
    expect(run({ status: "pending" })).toEqual([3, 1]);
    expect(run({ status: "done" })).toEqual([2]);
  });

  test("searches the name, the note and the member, ignoring case", () => {
    expect(run({ query: "ADA" })).toEqual([2]);
    expect(run({ query: "ikeja" })).toEqual([2]);
    expect(run({ query: "tolu" })).toEqual([3, 1]);
    expect(run({ query: "nobody" })).toEqual([]);
  });

  test("finds a phone number however it is typed", () => {
    expect(run({ query: "08035550101".slice(1) })).toEqual([1]);
    expect(run({ query: "803-555" })).toEqual([1]);
    expect(run({ query: "+234 803" })).toEqual([1]);
  });

  test("search and status filter combine", () => {
    expect(run({ query: "tolu", status: "done" })).toEqual([]);
    expect(run({ query: "a", status: "done" })).toEqual([2]);
  });

  test("keeps named people listed whatever the status filter, but not past the search", () => {
    expect(run({ status: "pending", keep: new Set([2]) })).toEqual([3, 2, 1]);
    expect(run({ status: "done", keep: new Set([1]) })).toEqual([2, 1]);
    expect(run({ status: "pending", keep: new Set([2]), query: "tolu" })).toEqual([3, 1]);
  });

  test("does not change the list it was given", () => {
    const before = ids(list);
    run({ sort: "name_asc" });
    expect(ids(list)).toEqual(before);
  });
});
