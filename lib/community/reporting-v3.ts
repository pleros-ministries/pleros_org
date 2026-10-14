import { churchBranchIds, type ChurchAssignment } from "@/lib/church/permissions";
import { normaliseContactInput } from "./outreach-contacts";
import { MINISTRY_COUNT_MAX, type MinistryFieldKey } from "./ministry-report";

export type PrivateContactInput = { name: string; phone: string; email: string | null; note: string | null };
export type MinistryContact = Omit<PrivateContactInput, "phone"> & { key: string; phone: string | null };

/** New capture rules only: legacy contacts with no phone remain untouched. */
export function normalisePrivateContact(input: { name?: unknown; phone?: unknown; email?: unknown; note?: unknown }):
  { ok: true; value: PrivateContactInput } | { ok: false; error: string; field: "name" | "phone" | "email" | "note" } {
  const parsed = normaliseContactInput(input);
  if (!parsed.ok) return { ...parsed, field: parsed.error.includes("phone") ? "phone" : parsed.error.includes("note") ? "note" : "name" };
  if (!parsed.value.phone) return { ok: false, field: "phone", error: "Enter a phone number." };
  if (input.email != null && typeof input.email !== "string") return { ok: false, field: "email", error: "Enter a valid email address, or leave it blank." };
  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { ok: false, field: "email", error: "Enter a valid email address, or leave it blank." };
  return { ok: true, value: { ...parsed.value, phone: parsed.value.phone, email: email || null } };
}

/** Contacts are a subset of this count, never an extra amount added to it. */
export function validateMinistryPeople(count: string, contacts: readonly MinistryContact[]): string | null {
  if (!/^\d+$/.test(count.trim()) || Number(count) > MINISTRY_COUNT_MAX) return `Enter a whole number from 0 to ${MINISTRY_COUNT_MAX.toLocaleString("en-GB")}.`;
  if (Number(count) < contacts.length) return "Include all named people in the total.";
  return null;
}

/** Only validate supplied numbers; do not resolve the unapproved blank/zero policy. */
export function validateEnteredOutcomes(values: Partial<Record<MinistryFieldKey, string>>): { field: MinistryFieldKey; error: string } | null {
  for (const [field, value] of Object.entries(values)) {
    if (value.trim() === "") continue;
    const error = validateMinistryPeople(value, []);
    if (error) return { field: field as MinistryFieldKey, error };
  }
  return null;
}

/** Same unit boundary for creation/selection; leading is participation, not an appointment. */
export function canUseMeetingUnit(viewer: ChurchAssignment | null, unit: { id: number; branchId: number }): boolean {
  if (!viewer) return false;
  if (viewer.role === "pastor") return true;
  if (viewer.role === "branch_pastor") return churchBranchIds(viewer).includes(unit.branchId);
  return ["unit_leader", "worker"].includes(viewer.role) && viewer.unitId === unit.id && viewer.branchId === unit.branchId;
}
