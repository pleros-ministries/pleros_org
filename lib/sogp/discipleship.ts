import { randomBytes } from "node:crypto";

import {
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

import { toLagosDateKey } from "./formation-progress";
import type { StudentStatus } from "./student-status";

/** Small enough to disciple personally, and bounds the per-disciple progress reads. */
export const DISCIPLESHIP_GROUP_MAX = 12;

/** Open groups one learner may lead at a time. */
export const DISCIPLESHIP_GROUPS_LED_MAX = 5;

export const DISCIPLESHIP_GROUP_NAME_MIN = 3;
export const DISCIPLESHIP_GROUP_NAME_MAX = 60;

/** `archived` is an admin pause; `closed` is the leader ending their own group. */
export type DiscipleshipGroupStatus = "active" | "archived" | "closed";

export const DISCIPLESHIP_PROMPT_MAX_LENGTH = 500;
export const DISCIPLESHIP_RESPONSE_MAX_LENGTH = 2000;
export const DISCIPLESHIP_REPLY_MAX_LENGTH = 1000;
export const DISCIPLESHIP_PRAYER_MAX_LENGTH = 500;
export const DISCIPLESHIP_CONTACT_NOTE_MAX_LENGTH = 500;
export const DISCIPLESHIP_NUDGE_NOTE_MAX_LENGTH = 200;

/** Cookie holding only an invite code while a new learner enrols. */
export const DISCIPLESHIP_INVITE_COOKIE = "pleros_discipleship_invite";
export const DISCIPLESHIP_INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const INVITE_CODE_PATTERN = /^[0-9a-f]{8}$/;

/** 8 lowercase hex chars — shareable, URL-safe (collision-checked on insert). */
export function generateInviteCode(): string {
  return randomBytes(4).toString("hex");
}

export function isValidInviteCode(value: string | null | undefined): value is string {
  return typeof value === "string" && INVITE_CODE_PATTERN.test(value);
}

export function buildDiscipleshipInvitePath(code: string): string {
  return `/sogp/discipleship/${encodeURIComponent(code)}`;
}

export function buildDiscipleshipInviteUrl(siteUrl: string, code: string): string {
  return `${siteUrl.replace(/\/$/, "")}${buildDiscipleshipInvitePath(code)}`;
}

export function buildDiscipleshipShareMessage(firstName: string): string {
  const name = firstName.trim() || "I";
  const lead = name === "I" ? "I'd" : `${name} would`;
  return `${lead} love to walk with you through SOGP. Join my discipleship group here:`;
}

export function defaultDiscipleshipGroupName(firstName: string): string {
  const name = firstName.trim();
  return name ? `${name}'s discipleship group` : "Discipleship group";
}

// ─── Leading several groups ─────────────────────────────────────────────────

export type DiscipleshipGroupNameResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

/**
 * Cleans a group name and checks it against the leader's other open groups, so
 * two of their groups never share a name in the switcher.
 */
export function validateDiscipleshipGroupName(
  value: unknown,
  otherNames: string[] = [],
): DiscipleshipGroupNameResult {
  const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (name.length < DISCIPLESHIP_GROUP_NAME_MIN) {
    return {
      ok: false,
      error: `Give the group a name of at least ${DISCIPLESHIP_GROUP_NAME_MIN} characters.`,
    };
  }
  if (name.length > DISCIPLESHIP_GROUP_NAME_MAX) {
    return {
      ok: false,
      error: `Keep the group name under ${DISCIPLESHIP_GROUP_NAME_MAX} characters.`,
    };
  }
  const taken = otherNames.some((other) => other.trim().toLowerCase() === name.toLowerCase());
  if (taken) {
    return { ok: false, error: "You already have a group with this name." };
  }
  return { ok: true, name };
}

export type DiscipleshipGroupBlock = "limit" | "paused" | "last_group";

export type DiscipleshipGroupDecision =
  | { ok: true }
  | { ok: false; reason: DiscipleshipGroupBlock };

/**
 * Whether a leader may start another group. A paused group blocks new ones, so
 * an admin pause cannot be sidestepped by opening a fresh group.
 */
export function evaluateCreateDiscipleshipGroup(input: {
  /** Groups the leader has that are not closed (active or paused). */
  openGroupCount: number;
  hasPausedGroup: boolean;
}): DiscipleshipGroupDecision {
  if (input.hasPausedGroup) return { ok: false, reason: "paused" };
  if (input.openGroupCount >= DISCIPLESHIP_GROUPS_LED_MAX) {
    return { ok: false, reason: "limit" };
  }
  return { ok: true };
}

/** Whether a leader may close a group: never a paused one, and never their last. */
export function evaluateCloseDiscipleshipGroup(input: {
  status: DiscipleshipGroupStatus;
  openGroupCount: number;
}): DiscipleshipGroupDecision {
  if (input.status !== "active") return { ok: false, reason: "paused" };
  if (input.openGroupCount <= 1) return { ok: false, reason: "last_group" };
  return { ok: true };
}

const GROUP_BLOCK_COPY: Record<DiscipleshipGroupBlock, string> = {
  limit: `You can lead up to ${DISCIPLESHIP_GROUPS_LED_MAX} groups. Close one you no longer need to start another.`,
  paused:
    "One of your groups has been paused by the Pleros team. Contact support before changing your groups.",
  last_group: "You need at least one group, so this one can't be closed.",
};

export function discipleshipGroupBlockMessage(reason: DiscipleshipGroupBlock): string {
  return GROUP_BLOCK_COPY[reason];
}

// ─── Joining ────────────────────────────────────────────────────────────────

export type DiscipleshipJoinBlock =
  | "own_group"
  | "already_in_group"
  | "circular"
  | "group_full"
  | "archived";

export type DiscipleshipJoinDecision =
  | { ok: true }
  | { ok: false; reason: DiscipleshipJoinBlock };

/**
 * Whether a learner may join a group. One level only: each learner has at most
 * one active discipler, and a discipler cannot join their own disciple's group.
 */
export function evaluateDiscipleshipJoin(input: {
  viewerEnrollmentId: number;
  group: { leaderEnrollmentId: number; status: DiscipleshipGroupStatus };
  /** Group id of the viewer's current active membership, if any. */
  viewerActiveGroupId: number | null;
  /** True when the group's leader is currently the viewer's disciple. */
  leaderIsViewersDisciple: boolean;
  activeMemberCount: number;
}): DiscipleshipJoinDecision {
  if (input.group.status !== "active") return { ok: false, reason: "archived" };
  if (input.group.leaderEnrollmentId === input.viewerEnrollmentId) {
    return { ok: false, reason: "own_group" };
  }
  if (input.viewerActiveGroupId !== null) {
    return { ok: false, reason: "already_in_group" };
  }
  if (input.leaderIsViewersDisciple) return { ok: false, reason: "circular" };
  if (input.activeMemberCount >= DISCIPLESHIP_GROUP_MAX) {
    return { ok: false, reason: "group_full" };
  }
  return { ok: true };
}

const JOIN_BLOCK_COPY: Record<DiscipleshipJoinBlock, string> = {
  own_group: "This is your own discipleship group. Share the link with the people you're walking with.",
  already_in_group:
    "You're already in a discipleship group. Leave your current group first if you'd like to join this one.",
  circular: "This person is already in your discipleship group, so you can't join theirs.",
  group_full: `This group is full. Groups have up to ${DISCIPLESHIP_GROUP_MAX} people.`,
  archived: "This discipleship group is no longer active.",
};

export function discipleshipJoinBlockMessage(reason: DiscipleshipJoinBlock): string {
  return JOIN_BLOCK_COPY[reason];
}

/**
 * `https://wa.me/<digits>` for a stored phone number, or null when it cannot be
 * parsed. Enrolment stores E.164 when valid; `countryCode` covers older rows.
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  countryCode?: string | null,
  text?: string,
): string | null {
  const raw = phone?.trim();
  if (!raw) return null;
  const region = countryCode?.toUpperCase();
  const parsed = parsePhoneNumberFromString(
    raw,
    region && isSupportedCountry(region) ? (region as CountryCode) : undefined,
  );
  if (!parsed?.isValid()) return null;
  const digits = parsed.number.replace(/\D/g, "");
  const query = text?.trim() ? `?text=${encodeURIComponent(text.trim())}` : "";
  return `https://wa.me/${digits}${query}`;
}

// ─── Nudges and contact log ─────────────────────────────────────────────────

/** Preset encouragement; actions accept only these keys plus a short personal line. */
export const DISCIPLESHIP_NUDGES = [
  { key: "praying", text: "I'm praying for you today." },
  { key: "catch_up", text: "Don't give up. Catch up on today's teaching when you can." },
  { key: "prayer_watch", text: "Join Morning Prayer Watch tomorrow?" },
  { key: "proud", text: "I'm proud of how you're keeping going." },
  { key: "check_in", text: "Just checking in. How are you doing?" },
] as const;

export type DiscipleshipNudgeKey = (typeof DISCIPLESHIP_NUDGES)[number]["key"];

export function findDiscipleshipNudge(key: string) {
  return DISCIPLESHIP_NUDGES.find((nudge) => nudge.key === key) ?? null;
}

/** Contact kinds a discipler logs by hand; `nudge` and `whatsapp` are recorded automatically. */
export const DISCIPLESHIP_MANUAL_CONTACT_KINDS = ["call", "visit", "message", "note"] as const;
export type DiscipleshipManualContactKind = (typeof DISCIPLESHIP_MANUAL_CONTACT_KINDS)[number];

export function isManualContactKind(value: string): value is DiscipleshipManualContactKind {
  return (DISCIPLESHIP_MANUAL_CONTACT_KINDS as readonly string[]).includes(value);
}

/** After this many days without contact the row nudges the discipler to reach out. */
export const DISCIPLESHIP_CONTACT_STALE_DAYS = 7;

// ─── Status alerts and weekly digest ────────────────────────────────────────

const CONCERNING_STATUSES = new Set<StudentStatus>(["at_risk", "unresponsive"]);

export type DiscipleshipStatusAlert = "slipped" | "recovered" | null;

/**
 * Alert only on transitions: into at-risk/not-active, or back on track from
 * there. A missing previous status (first run) never alerts on recovery.
 */
export function shouldAlertStatusChange(
  previous: string | null,
  next: StudentStatus,
): DiscipleshipStatusAlert {
  const wasConcerning = previous !== null && CONCERNING_STATUSES.has(previous as StudentStatus);
  if (CONCERNING_STATUSES.has(next)) return wasConcerning ? null : "slipped";
  if (next === "on_track" && wasConcerning) return "recovered";
  return null;
}

export function buildStatusAlertBody(
  firstName: string,
  status: StudentStatus,
  alert: Exclude<DiscipleshipStatusAlert, null>,
): string {
  if (alert === "recovered") return `${firstName} is back on track. Send them some encouragement.`;
  return status === "unresponsive"
    ? `${firstName} hasn't been active for a while. Reach out to them today.`
    : `${firstName} is at risk of falling behind. Send an encouragement?`;
}

const DIGEST_STATUS_ORDER: Array<{ statuses: StudentStatus[]; label: string }> = [
  { statuses: ["on_track"], label: "on track" },
  { statuses: ["day_inconsistent", "activity_inconsistent", "generally_inconsistent", "declining"], label: "slowing down" },
  { statuses: ["at_risk"], label: "at risk" },
  { statuses: ["unresponsive"], label: "not active" },
];

export function buildWeeklyDigest(input: {
  statuses: Array<StudentStatus | null>;
  unansweredCheckIns: number;
  openPrayerRequests: number;
  /** Set when the leader runs more than one group, so each digest says which. */
  groupName?: string | null;
}): { title: string; body: string } | null {
  if (input.statuses.length === 0) return null;
  const parts = DIGEST_STATUS_ORDER.flatMap(({ statuses, label }) => {
    const n = input.statuses.filter((status) => status && statuses.includes(status)).length;
    return n > 0 ? [`${n} ${label}`] : [];
  });
  if (input.unansweredCheckIns > 0) {
    parts.push(
      `${input.unansweredCheckIns} check-in answer${input.unansweredCheckIns === 1 ? "" : "s"} outstanding`,
    );
  }
  if (input.openPrayerRequests > 0) {
    parts.push(
      `${input.openPrayerRequests} prayer request${input.openPrayerRequests === 1 ? "" : "s"}`,
    );
  }
  const summary = parts.length
    ? parts.join(" · ")
    : `${input.statuses.length} disciples in your group`;
  const groupName = input.groupName?.trim();
  return {
    title: "Your discipleship week",
    body: groupName ? `${groupName}: ${summary}` : summary,
  };
}

/** The weekly digest goes out on Mondays, Lagos time. */
export function isDigestDay(now: Date): boolean {
  return new Date(`${toLagosDateKey(now)}T12:00:00Z`).getUTCDay() === 1;
}

// ─── Curriculum-aligned check-in suggestions ───────────────────────────────

export const GENERIC_PROMPT_SUGGESTIONS = [
  "What did God teach you through this week's teachings?",
  "How can I pray for you this week?",
  "What is one thing you will put into practice from today's lesson?",
];

export function buildCurriculumPromptSuggestions(input: {
  levelTitle: string | null;
  teachingTitles: string[];
}): string[] {
  const [latest, earlier] = input.teachingTitles;
  if (!latest) return GENERIC_PROMPT_SUGGESTIONS;
  return [
    `What stood out to you in "${latest}"?`,
    input.levelTitle
      ? `How will you live out "${input.levelTitle}" this week?`
      : `What will you put into practice from "${earlier ?? latest}"?`,
    `How can I pray for you as you study "${earlier ?? latest}"?`,
  ];
}
