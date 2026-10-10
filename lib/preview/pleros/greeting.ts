/** Greeting follows the current Lagos clock, independently of report-history dates. */
export function timeOfDayGreeting(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}
