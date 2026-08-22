export type SogpLiveClassDisplayState =
  | "upcoming"
  | "live"
  | "ended"
  | "cancelled";

export function deriveLiveClassState(input: {
  now: Date;
  startsAt: Date;
  endsAt: Date;
  status: "scheduled" | "live" | "completed" | "cancelled";
}): SogpLiveClassDisplayState {
  if (input.status === "cancelled") return "cancelled";
  if (input.status === "completed" || input.now >= input.endsAt) return "ended";
  if (input.status === "live" || input.now >= input.startsAt) return "live";
  return "upcoming";
}
