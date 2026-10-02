/**
 * Fullness of Christ Church membership tag on SOGP enrolments. Admins set it
 * from My Enrollees; null means it hasn't been set yet.
 */
export type FullnessMembership = "fullness" | "non_fullness";

export type FullnessFilter = "all" | FullnessMembership | "unset";

export const FULLNESS_VALUES: FullnessMembership[] = ["fullness", "non_fullness"];

export const FULLNESS_FILTER_OPTIONS: Array<{ value: FullnessFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "fullness", label: "Fullness" },
  { value: "non_fullness", label: "Non-Fullness" },
  { value: "unset", label: "Not set" },
];

export function fullnessLabel(value: FullnessMembership | null): string {
  if (value === "fullness") return "Fullness";
  if (value === "non_fullness") return "Non-Fullness";
  return "Not set";
}

export function isFullnessMembership(value: unknown): value is FullnessMembership {
  return value === "fullness" || value === "non_fullness";
}

export function matchesFullnessFilter(
  value: FullnessMembership | null,
  filter: FullnessFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "unset") return value === null;
  return value === filter;
}

/** Sort rank for "Fullness first": Fullness, then Non-Fullness, then not set. */
export function fullnessRank(value: FullnessMembership | null): number {
  if (value === "fullness") return 0;
  if (value === "non_fullness") return 1;
  return 2;
}
