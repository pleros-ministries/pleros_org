import { toLagosDateKey } from "./formation-progress";

export const DAILY_REVIEW_TITLE = "Daily Review & Q/A (Telegram)";

export type DailyReviewSession = { startsAt: Date; endsAt: Date };

// Mon-Sat 8:00-8:30pm, Sunday 7:00-8:00pm, all Africa/Lagos (fixed UTC+1).
function sessionTimes(isSunday: boolean) {
  return isSunday ? (["19:00", "20:00"] as const) : (["20:00", "20:30"] as const);
}

export function buildDailyReviewSessions(input: {
  startsAt: Date;
  endsAt: Date;
  now: Date;
}): DailyReviewSession[] {
  const sessions: DailyReviewSession[] = [];
  const lastKey = toLagosDateKey(input.endsAt);
  const cursor = new Date(`${toLagosDateKey(input.startsAt)}T00:00:00.000Z`);

  for (let guard = 0; guard < 400; guard += 1) {
    const dateKey = cursor.toISOString().slice(0, 10);
    if (dateKey > lastKey) break;
    const isSunday = cursor.getUTCDay() === 0;
    const [start, end] = sessionTimes(isSunday);
    const session = {
      startsAt: new Date(`${dateKey}T${start}:00+01:00`),
      endsAt: new Date(`${dateKey}T${end}:00+01:00`),
    };
    if (session.endsAt > input.now) sessions.push(session);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return sessions;
}
