const LAGOS = "Africa/Lagos";

const hourFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: LAGOS,
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: LAGOS,
});

/** "Good morning" / "Good afternoon" / "Good evening" by the Lagos clock. */
export function lagosGreeting(now = new Date()): string {
  const hour = Number(hourFormat.format(now));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** "Friday 9 October" in Lagos. */
export function lagosDateLabel(now = new Date()): string {
  return dateFormat.format(now).replace(",", "");
}

/** "Start Here" → "Start here"; all-caps words such as "SOGP" stay as they are. */
export function sentenceCase(value: string): string {
  return value
    .split(" ")
    .map((word, index) =>
      index === 0 || word === word.toUpperCase() ? word : word.toLowerCase(),
    )
    .join(" ");
}
