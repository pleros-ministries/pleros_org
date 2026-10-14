import { describe, expect, it } from "vitest";
import { normalisePrivateContact, canUseMeetingUnit, validateMinistryPeople, validateEnteredOutcomes, type MinistryContact } from "./reporting-v3";
import type { ChurchAssignment } from "@/lib/church/permissions";

describe("private contact capture", () => {
  it("requires a phone and permits an omitted email", () => {
    expect(normalisePrivateContact({ name: "Ada Bello", phone: "" }).ok).toBe(false);
    expect(normalisePrivateContact({ name: "Ada Bello", phone: "+234 800 000 0102" })).toEqual({ ok: true, value: { name: "Ada Bello", phone: "+234 800 000 0102", email: null, note: null } });
  });
  it.each(["not-an-email", "a@", "a b@example.com", "a@example.com\nBcc:x@y.com"])("rejects invalid email %s", (email) => {
    expect(normalisePrivateContact({ name: "Ada Bello", phone: "+234 800 000 0102", email }).ok).toBe(false);
  });
  it("normalises fields without resolving an account or membership", () => {
    expect(normalisePrivateContact({ name: " Ada  Bello ", phone: " +234 800 000 0102 ", email: " ada@example.com ", note: " Met today " })).toEqual({ ok: true, value: { name: "Ada Bello", phone: "+234 800 000 0102", email: "ada@example.com", note: "Met today" } });
  });
  it("rejects a supplied non-string email instead of silently discarding it", () => {
    expect(normalisePrivateContact({ name: "Ada Bello", phone: "+234 800 000 0102", email: 123 }).ok).toBe(false);
  });
});

describe("ministry counts", () => {
  const contacts: MinistryContact[] = [{ key: "a", name: "Ada", phone: "+234 800 000 0102", email: null, note: null }];
  it("permits counts without names", () => expect(validateMinistryPeople("3", [])).toBeNull());
  it("requires named people to be included, not added to the entered total", () => {
    expect(validateMinistryPeople("0", contacts)).not.toBeNull();
    expect(validateMinistryPeople("1", contacts)).toBeNull();
  });
  it.each(["", "-1", "1.5", "100001", "Infinity"])("rejects invalid count %s", (count) => expect(validateMinistryPeople(count, [])).not.toBeNull());
  it("keeps blank outcomes unspecified but rejects entered invalid numbers", () => {
    expect(validateEnteredOutcomes({ saved: "", healed: "0" })).toBeNull();
    expect(validateEnteredOutcomes({ saved: "-1" })).toEqual({ field: "saved", error: "Enter a whole number from 0 to 100,000." });
    expect(validateEnteredOutcomes({ filled: "1.5" })?.field).toBe("filled");
  });
});

describe("shared meetings use church units, not geographic or auth roles", () => {
  const unit = { id: 8, branchId: 2 };
  const worker: ChurchAssignment = { userId: "w", role: "worker", branchId: 2, unitId: 8, supervisorId: "u" };
  it("allows a worker or unit leader in their assigned unit to lead or attend", () => {
    expect(canUseMeetingUnit(worker, unit)).toBe(true);
    expect(canUseMeetingUnit({ ...worker, role: "unit_leader" }, unit)).toBe(true);
    expect(canUseMeetingUnit(worker, { id: 9, branchId: 2 })).toBe(false);
    expect(canUseMeetingUnit(worker, { id: 8, branchId: 3 })).toBe(false);
  });
  it("allows Branch Pastors only in explicitly assigned branches", () => {
    const branch = { ...worker, role: "branch_pastor", unitId: null, branchId: 1, branchIds: [1, 2] };
    expect(canUseMeetingUnit(branch, unit)).toBe(true);
    expect(canUseMeetingUnit({ ...branch, branchIds: [1] }, unit)).toBe(false);
    expect(canUseMeetingUnit({ ...branch, branchIds: [] }, unit)).toBe(false);
  });
  it("allows the Pastor but rejects missing or unrelated appointments", () => {
    expect(canUseMeetingUnit({ ...worker, role: "pastor", branchId: null, unitId: null }, unit)).toBe(true);
    expect(canUseMeetingUnit(null, unit)).toBe(false);
    expect(canUseMeetingUnit({ ...worker, role: "super_admin" }, unit)).toBe(false);
    expect(canUseMeetingUnit({ ...worker, role: "moderator" }, unit)).toBe(false);
  });
});
