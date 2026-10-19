import { CommunityError } from "./errors";
import { normaliseActivityInput, type ActivityInput } from "./ministry-activities";
import { MINISTRY_COUNT_MAX, MINISTRY_FIELDS, isDateKey, type MinistryFieldKey } from "./ministry-report";
import { CONTACTS_PER_DAY_MAX } from "./outreach-contacts";
import { DIRECT_METHODS, DISCIPLESHIP_ACTIONS, PERSON_OUTCOMES, directMode, isEvangelismStyle, outcomeTotals, type ContactOutcomes, type DiscipleshipAction, type EvangelismStyle } from "./report-popups";

export function inputRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CommunityError("Choose valid report details.");
  return value as Record<string, unknown>;
}
export function reportRequestKey(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new CommunityError("Reload the form before saving.");
  return value.toLowerCase();
}
export function reportCount(value: unknown): number {
  const number = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value) : NaN;
  if (!Number.isInteger(number) || number < 0 || number > MINISTRY_COUNT_MAX) throw new CommunityError("Enter a whole number from 0 to 100,000.");
  return number;
}
export function reportId(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > 2147483647) throw new CommunityError("Choose an existing record.");
  return value;
}
export function parseReportContacts(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > CONTACTS_PER_DAY_MAX || value.some(key =>
    typeof key !== "string" || !/^(private|legacy):[1-9]\d*$/.test(key) || !Number.isSafeInteger(Number(key.split(":")[1])) || Number(key.split(":")[1]) > 2147483647
  ) || new Set(value).size !== value.length) throw new CommunityError("Choose valid saved contacts, once each.");
  return value;
}
function text(value: unknown, limit: number): string {
  if (value == null) return "";
  if (typeof value !== "string" || value.trim().length > limit) throw new CommunityError(`Keep this field under ${limit} characters.`);
  return value.trim();
}

/** What the report pop-ups add: evangelism style, discipleship ticks and per-person outcomes. */
export type MinistryReportDetails = { style: EvangelismStyle | null; actions: DiscipleshipAction[]; contactOutcomes: ContactOutcomes };

function parseActions(value: unknown): DiscipleshipAction[] {
  if (value == null) return [];
  if (!Array.isArray(value) || new Set(value).size !== value.length || value.some(key => !DISCIPLESHIP_ACTIONS.some(row => row.key === key))) throw new CommunityError("Choose what you did from the list.");
  return value as DiscipleshipAction[];
}
function parseContactOutcomes(value: unknown, contacts: readonly string[]): ContactOutcomes {
  if (value == null) return {};
  const record = inputRecord(value), parsed: ContactOutcomes = {};
  for (const [key, ticks] of Object.entries(record)) {
    if (!contacts.includes(key) || !Array.isArray(ticks) || new Set(ticks).size !== ticks.length || ticks.some(tick => !(PERSON_OUTCOMES as readonly unknown[]).includes(tick))) throw new CommunityError("Choose saved, filled or healed for the people in this report.");
    if (ticks.length) parsed[key] = ticks as ContactOutcomes[string];
  }
  return parsed;
}

export function parseMinistryReport(value: unknown): { activity: ActivityInput; contacts: string[]; method: string; context: string | null; enteredOutcomes: Partial<Record<MinistryFieldKey, string>>; details: MinistryReportDetails } {
  const input = inputRecord(value);
  if (input.kind !== "outreach" && input.kind !== "follow_up") throw new CommunityError("Choose Evangelism or Discipleship.");
  const contacts = parseReportContacts(input.contacts);
  const count = reportCount(input.peopleCount);
  if (count < contacts.length) throw new CommunityError("Include all named people in the total.");
  const context = text(input.context, 120);
  const method = text(input.method, 40);
  if (input.style != null && (input.kind !== "outreach" || !isEvangelismStyle(input.style))) throw new CommunityError("Choose broadcast or one-to-one.");
  const style = input.kind === "outreach" && isEvangelismStyle(input.style) ? input.style : null;
  const permitted: readonly string[] = input.kind === "follow_up" ? ["In person", "Phone call", "WhatsApp", "Mixed methods"] : style === "direct" ? DIRECT_METHODS : ["In person", "Online", "Both"];
  if (!permitted.includes(method)) throw new CommunityError("Choose how you connected.");
  const actions = input.kind === "follow_up" ? parseActions(input.actions) : [];
  const contactOutcomes = style === "direct" ? parseContactOutcomes(input.contactOutcomes, contacts) : {};
  // One-to-one outcomes are ticked per person, so the totals come from the people.
  const outcomes = style === "direct" ? Object.fromEntries(Object.entries(outcomeTotals(contactOutcomes)).filter(([, n]) => n > 0).map(([key, n]) => [key, String(n)])) : inputRecord(input.outcomes ?? {});
  const enteredOutcomes: Partial<Record<MinistryFieldKey, string>> = {};
  const values: Partial<Record<MinistryFieldKey, string>> = {};
  for (const { key } of MINISTRY_FIELDS) if ((input.kind === "follow_up" ? ["saved", "filled", "healed"] : ["saved", "notSaved", "filled", "healed"]).includes(key) && key in outcomes) {
    if (typeof outcomes[key] !== "string") throw new CommunityError("Enter valid ministry numbers.");
    const raw = (outcomes[key] as string).trim();
    if (raw) reportCount(raw);
    values[key] = raw; enteredOutcomes[key] = raw;
  }
  let mode: "online" | "offline" | "both" | undefined;
  let platform = text(input.platform, 120);
  // Follow-ups live in the people picked, not in a number, so discipleship sets no counts
  // here and is never a broadcast: only evangelism takes a style.
  if (input.kind !== "follow_up" && style === "direct") {
    const direct = directMode(method);
    mode = direct.mode; platform = direct.platform ?? "";
    values[mode === "online" ? "reachedOnline" : "reachedOffline"] = String(count);
  } else if (input.kind !== "follow_up") {
    mode = method === "Online" ? "online" : method === "Both" ? "both" : "offline";
    if (mode === "both") {
      const online = reportCount(input.onlineCount), offline = reportCount(input.offlineCount);
      if (online + offline !== count) throw new CommunityError("Online and offline counts must add up to the total.");
      values.reachedOnline = String(online); values.reachedOffline = String(offline);
    } else values[mode === "online" ? "reachedOnline" : "reachedOffline"] = String(count);
  }
  const parsed = normaliseActivityInput({ kind: input.kind, mode, platform, platformOther: text(input.platformOther, 120), location: context, note: text(input.note, 500), values, peopleCount: contacts.length });
  if (!parsed.ok) throw new CommunityError(parsed.error);
  return { activity: parsed.value, contacts, method, context: context || null, enteredOutcomes, details: { style, actions, contactOutcomes } };
}

export function parseSharedMeeting(value: unknown): {
  kind: "teaching_meeting" | "prayer_meeting"; subject: string | null; venue: string | null;
  startsAt: Date | null; endsAt: Date | null; totalAttendance: number;
} {
  const input = inputRecord(value);
  if (input.kind !== "teaching_meeting" && input.kind !== "prayer_meeting") throw new CommunityError("Choose Teaching or Prayer.");
  const subject = text(input.subject, 500), venue = text(input.venue, 120);
  const totalAttendance = reportCount(input.totalAttendance);
  if (input.kind === "teaching_meeting") {
    if (!subject) throw new CommunityError("Enter the meeting subject.");
    return { kind: input.kind, subject, venue: null, startsAt: null, endsAt: null, totalAttendance };
  }
  if (subject) throw new CommunityError("Prayer meetings have no subject.");
  const instant = (value: unknown) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value) || !isDateKey(value.slice(0, 10)) || !Number.isFinite(Date.parse(value))) throw new CommunityError("Choose an explicit start and end date/time.");
    return new Date(value);
  };
  const startsAt = instant(input.startsAt), endsAt = instant(input.endsAt);
  if (!venue || endsAt <= startsAt) throw new CommunityError("Enter a venue and an end after the start. No overnight end is inferred.");
  return { kind: input.kind, subject: null, venue, startsAt, endsAt, totalAttendance };
}
