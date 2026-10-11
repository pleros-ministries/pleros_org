import { canReportFor } from "./ministry-report";

export type DailyReportCategory = "devotional" | "ministry" | "meetings";
export type DailyReportDeclaration = "confirmed" | "nil";
export type DailyReportStatus = "reported" | "nil" | "missing";
export type MeetingReportingRole = "leader" | "worker" | "member";

/** Declarations record reporting status; canonical devotional/activity facts stay elsewhere. */
export function dailyCategoryStatus(input: {
  category: DailyReportCategory; declaration: DailyReportDeclaration | null;
  activityCount: number; hasDevotionalActivity: boolean;
}): DailyReportStatus {
  if (input.category === "devotional") {
    if (input.declaration !== "confirmed") return "missing";
    return input.hasDevotionalActivity ? "reported" : "nil";
  }
  if (input.activityCount > 0) return "reported";
  return input.declaration === "nil" ? "nil" : "missing";
}

export function validateDailyDeclaration(input: {
  date: string; today: string; category: unknown; declaration: unknown; categoryActivityCount: number;
}): string | null {
  if (!canReportFor(input.date, input.today)) return "That report date is view only.";
  if (typeof input.category !== "string" || !["devotional", "ministry", "meetings"].includes(input.category)) return "Choose a report category.";
  if (input.category === "devotional") return input.declaration === "confirmed" ? null : "Confirm the devotional report from its recorded sources.";
  if (input.declaration !== "nil") return "Choose Nil to explicitly record no activity.";
  return input.categoryActivityCount > 0 ? "Recorded activity already exists for this category." : null;
}

export function normaliseMeetingDetails(input: { kind: string; role: unknown; taught: unknown; attendance: number }): { ok: false; error: string } | { ok: true; value: { role: MeetingReportingRole; taught: string | null } } {
  if (input.kind !== "teaching_meeting" && input.kind !== "prayer_meeting") return { ok: false as const, error: "Choose a teaching or prayer meeting." };
  if (input.role !== "leader" && input.role !== "worker" && input.role !== "member") return { ok: false as const, error: "Choose Leader, Worker or Member." };
  if (!Number.isInteger(input.attendance) || input.attendance < 0 || input.attendance > 100_000) return { ok: false as const, error: "Enter a valid attendance count." };
  if (input.role === "member" && input.attendance !== 1) return { ok: false as const, error: "Members record their own attendance only." };
  const taught = typeof input.taught === "string" ? input.taught.trim() : "";
  if (taught.length > 500) return { ok: false as const, error: "Keep what was taught under 500 characters." };
  if (input.role === "leader" && !taught) return { ok: false as const, error: "Record what was taught." };
  return { ok: true as const, value: { role: input.role, taught: input.role === "leader" ? taught : null } };
}
