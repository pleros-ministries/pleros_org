export type DashboardArea = "you" | "community";

/** Deliberate horizontal gestures only; tabs stop at either end. */
export function tabAfterSwipe(area: DashboardArea, dx: number, dy: number, elapsedMs: number): DashboardArea {
  if (elapsedMs < 0 || Math.abs(dx) < 64 || Math.abs(dy) > Math.abs(dx) / 2) return area;
  if (dx < 0 && area === "you") return "community";
  if (dx > 0 && area === "community") return "you";
  return area;
}
