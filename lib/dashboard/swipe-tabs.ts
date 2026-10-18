export type DashboardArea = "you" | "community";

/** A short swipe still counts when it is a quick flick (px per ms over the gesture). */
const FLICK_MIN_PX = 24;
const FLICK_SPEED = 0.3;

/** Deliberate horizontal gestures only; tabs stop at either end. */
export function tabAfterSwipe(area: DashboardArea, dx: number, dy: number, elapsedMs: number): DashboardArea {
  const distance = Math.abs(dx);
  const flick = distance >= FLICK_MIN_PX && elapsedMs > 0 && distance / elapsedMs > FLICK_SPEED;
  if (elapsedMs < 0 || (distance < 64 && !flick) || Math.abs(dy) > distance / 2) return area;
  if (dx < 0 && area === "you") return "community";
  if (dx > 0 && area === "community") return "you";
  return area;
}
