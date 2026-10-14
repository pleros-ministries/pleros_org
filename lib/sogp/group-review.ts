export type GroupReviewScheduleInput = { groupId: number; title: string; date: string; startTime: string; endTime: string; venue: string; requestKey: string };
export function groupReviewTimeLabel(startsAt: string, endsAt: string) {
  const date = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit", hour12: true });
  return `${date.format(new Date(startsAt))} · ${clock.format(new Date(startsAt))}–${clock.format(new Date(endsAt))}`;
}
export function parseGroupReviewSchedule(raw: unknown, now = new Date()) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Complete the review details.");
  const value = raw as Record<string, unknown>;
  if (!Number.isSafeInteger(value.groupId) || Number(value.groupId) < 1) throw new Error("Choose one of your active groups.");
  const text = (key: string, max: number) => {
    const field = value[key];
    if (typeof field !== "string" || !field.trim() || field.trim().length > max) throw new Error(`Enter a valid ${key === "title" ? "review title" : "venue"}.`);
    return field.trim();
  };
  const title = text("title", 160), venue = text("venue", 300);
  const date = value.date, start = value.startTime, end = value.endTime;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof start !== "string" || typeof end !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end)) throw new Error("Choose a valid date and start/end time in Lagos.");
  const day = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0,10) !== date) throw new Error("Choose a valid review date.");
  const startsAt = new Date(`${date}T${start}:00+01:00`), endsAt = new Date(`${date}T${end}:00+01:00`);
  if (startsAt <= now) throw new Error("Choose an upcoming review date and time.");
  if (endsAt <= startsAt) throw new Error("End time must be after start time on the selected date.");
  if (typeof value.requestKey !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.requestKey)) throw new Error("Refresh the form before scheduling.");
  return { groupId: Number(value.groupId), title, venue, startsAt, endsAt, requestKey: value.requestKey };
}
