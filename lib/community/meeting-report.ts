/**
 * A meeting on My reports (Pastor, 21 October): a teaching or prayer meeting
 * someone led or attended, or an outreach meeting drawn from the day's
 * evangelism and discipleship. Leading one asks when it started and ended,
 * where, and who was there (workers and members); attending asks how many
 * people you brought. Pure, so the pop-up and the server action agree.
 */

export type MeetingKind = "teaching" | "prayer" | "outreach";
export type MeetingRole = "led" | "attended";
export type NoPart = "evangelism" | "discipleship" | "meetings";

export const MEETING_ACTIVITY_KIND = { teaching: "teaching_meeting", prayer: "prayer_meeting", outreach: "outreach_meeting" } as const;
export const MEETING_LABEL: Record<MeetingKind, string> = { teaching: "Teaching meeting", prayer: "Prayer meeting", outreach: "Outreach meeting" };

export const EMPHASIS_MAX = 160;
export const VENUE_MAX = 120;
export const MEETING_NOTE_MAX = 500;
export const BROUGHT_MAX = 50;
export const ATTENDANCE_MAX = 100_000;
export const NO_REASON_MIN = 3;
export const NO_REASON_MAX = 300;

export type MeetingInput = {
  kind: MeetingKind;
  role: MeetingRole | null;
  emphasis: string | null;
  startsAt: string | null;
  endsAt: string | null;
  venue: string | null;
  workers: number | null;
  members: number | null;
  brought: number;
  note: string | null;
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const text = (value: unknown, max: number) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
const whole = (value: unknown) => typeof value === "number" && Number.isInteger(value) ? value : null;

/** Minutes from start to end; an end before the start runs past midnight (an overnight prayer meeting). */
export function meetingMinutes(startsAt: string, endsAt: string) {
  return (minutesOf(endsAt) - minutesOf(startsAt) + 1440) % 1440;
}

export function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return [hours ? `${hours} hr` : null, rest ? `${rest} min` : null].filter(Boolean).join(" ");
}

/** "6 pm", "7:30 pm" from "18:00", "19:30". */
export function clockLabel(time: string) {
  const hours = Number(time.slice(0, 2)), minutes = Number(time.slice(3, 5));
  return `${hours % 12 || 12}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""} ${hours < 12 ? "am" : "pm"}`;
}

/** Reads a meeting sent from the pop-up; returns a message to show when something is missing. */
export function parseMeetingInput(raw: unknown): { ok: true; value: MeetingInput } | { ok: false; error: string } {
  const input = (raw ?? {}) as Record<string, unknown>;
  const kind = input.kind;
  if (kind !== "teaching" && kind !== "prayer" && kind !== "outreach") return { ok: false, error: "Choose which meeting it was." };
  const note = text(input.note, MEETING_NOTE_MAX);
  // Outreach has no led or attended: it is the day's evangelism and discipleship.
  if (kind === "outreach") return { ok: true, value: { kind, role: null, emphasis: null, startsAt: null, endsAt: null, venue: null, workers: null, members: null, brought: 0, note } };
  const role = input.role;
  if (role !== "led" && role !== "attended") return { ok: false, error: "Say whether you led it or attended." };
  if (role === "attended") {
    const brought = whole(input.brought) ?? 0;
    if (brought < 0 || brought > BROUGHT_MAX) return { ok: false, error: `People you brought can be 0 to ${BROUGHT_MAX}.` };
    return { ok: true, value: { kind, role, emphasis: null, startsAt: null, endsAt: null, venue: null, workers: null, members: null, brought, note } };
  }
  const emphasis = kind === "teaching" ? text(input.emphasis, EMPHASIS_MAX) : null;
  if (kind === "teaching" && !emphasis) return { ok: false, error: "Add the teaching emphasis." };
  const startsAt = typeof input.startsAt === "string" && TIME.test(input.startsAt) ? input.startsAt : null;
  const endsAt = typeof input.endsAt === "string" && TIME.test(input.endsAt) ? input.endsAt : null;
  if (!startsAt || !endsAt) return { ok: false, error: "Add when it started and ended." };
  if (startsAt === endsAt) return { ok: false, error: "It can’t start and end at the same time." };
  const venue = text(input.venue, VENUE_MAX);
  if (!venue || venue.length < 2) return { ok: false, error: "Add the venue." };
  const workers = whole(input.workers) ?? 0, members = whole(input.members) ?? 0;
  if (workers < 0 || members < 0 || workers > ATTENDANCE_MAX || members > ATTENDANCE_MAX) return { ok: false, error: "Check the numbers of workers and members." };
  if (workers + members === 0) return { ok: false, error: "Add how many workers and members were there." };
  return { ok: true, value: { kind, role, emphasis, startsAt, endsAt, venue, workers, members, brought: 0, note } };
}

/** A reason for answering No: 3 to 300 characters once trimmed. */
export function parseNoReason(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const reason = typeof raw === "string" ? raw.trim() : "";
  if (reason.length < NO_REASON_MIN) return { ok: false, error: "Add a short reason." };
  if (reason.length > NO_REASON_MAX) return { ok: false, error: `Keep the reason under ${NO_REASON_MAX} characters.` };
  return { ok: true, value: reason };
}

/** One line for a saved meeting: "Faith that works · 6 pm to 7:30 pm (1 hr 30 min) · Church hall · 23 present". */
export function meetingLine(meeting: { role: MeetingRole; emphasis: string | null; startsAt: string | null; endsAt: string | null; venue: string | null; workers: number | null; members: number | null; brought: number }) {
  if (meeting.role === "attended") return meeting.brought ? `Brought ${meeting.brought === 1 ? "1 person" : `${meeting.brought} people`}` : "Attended";
  const time = meeting.startsAt && meeting.endsAt ? `${clockLabel(meeting.startsAt)} to ${clockLabel(meeting.endsAt)} (${durationLabel(meetingMinutes(meeting.startsAt, meeting.endsAt))})` : null;
  const present = (meeting.workers ?? 0) + (meeting.members ?? 0);
  return [meeting.emphasis, time, meeting.venue, present ? `${present} present` : null].filter(Boolean).join(" · ");
}
