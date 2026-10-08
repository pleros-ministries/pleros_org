import { isDateKey } from "./ministry-report";

/**
 * Rules for the people a member meets in ministry. Pure so the validation,
 * the "who may see this person" rule and the list filters are unit-tested.
 *
 * These are people outside Pleros. Their name, phone number, statuses and
 * interaction history go only to the member who met them, the pastor
 * assigned to that member's location group, and admins — never to a
 * discipler or other learners.
 */

export const CONTACT_NAME_MAX = 80;
export const CONTACT_PHONE_MAX = 30;
export const CONTACT_NOTE_MAX = 300;
export const FOLLOW_UP_NOTE_MAX = 300;
export const FOLLOW_UP_PLAN_MAX = 300;
export const INTERACTION_NOTE_MAX = 300;
/** People one member may add or follow up in a single activity. */
export const CONTACTS_PER_DAY_MAX = 50;

// ─── Statuses ──────────────────────────────────────────────────────────────

export type SalvationStatus = "unknown" | "not_saved" | "saved" | "believer";

export type DiscipleshipStatus =
  | "not_started"
  | "following_up"
  | "in_discipleship"
  | "in_sogp"
  | "in_church"
  | "lost_contact";

export const SALVATION_STATUSES: ReadonlyArray<{ key: SalvationStatus; label: string }> = [
  { key: "unknown", label: "Not sure yet" },
  { key: "not_saved", label: "Not yet saved" },
  { key: "saved", label: "Gave their life to Christ" },
  { key: "believer", label: "Already a believer" },
];

export const DISCIPLESHIP_STATUSES: ReadonlyArray<{
  key: DiscipleshipStatus;
  label: string;
}> = [
  { key: "not_started", label: "Not started" },
  { key: "following_up", label: "Being followed up" },
  { key: "in_discipleship", label: "In discipleship" },
  { key: "in_sogp", label: "Enrolled in SOGP" },
  { key: "in_church", label: "Settled in a church" },
  { key: "lost_contact", label: "Lost contact" },
];

export const SALVATION_STATUS_LABELS = Object.fromEntries(
  SALVATION_STATUSES.map((status) => [status.key, status.label]),
) as Record<SalvationStatus, string>;

export const DISCIPLESHIP_STATUS_LABELS = Object.fromEntries(
  DISCIPLESHIP_STATUSES.map((status) => [status.key, status.label]),
) as Record<DiscipleshipStatus, string>;

export function isSalvationStatus(value: unknown): value is SalvationStatus {
  return SALVATION_STATUSES.some((status) => status.key === value);
}

export function isDiscipleshipStatus(value: unknown): value is DiscipleshipStatus {
  return DISCIPLESHIP_STATUSES.some((status) => status.key === value);
}

// ─── Interactions ──────────────────────────────────────────────────────────

/**
 * One touch with a person. `met` belongs to the outreach they were met at;
 * `follow_up` is an older "followed up" tick with no channel recorded; the
 * rest are what a member or pastor logs afterwards.
 */
export type InteractionKind =
  | "met"
  | "follow_up"
  | "call"
  | "whatsapp"
  | "visit"
  | "message"
  | "other";

export type LoggableInteractionKind = Exclude<InteractionKind, "met" | "follow_up">;

/** The kinds a person can log, in the order the form offers them. */
export const INTERACTION_KINDS: ReadonlyArray<{
  key: LoggableInteractionKind;
  label: string;
}> = [
  { key: "call", label: "Call" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "visit", label: "Visit" },
  { key: "message", label: "Message" },
  { key: "other", label: "Other" },
];

export const INTERACTION_KIND_LABELS: Record<InteractionKind, string> = {
  met: "Met",
  follow_up: "Followed up",
  call: "Call",
  whatsapp: "WhatsApp",
  visit: "Visit",
  message: "Message",
  other: "Other",
};

export function isLoggableInteractionKind(value: unknown): value is LoggableInteractionKind {
  return INTERACTION_KINDS.some((kind) => kind.key === value);
}

/** What happened for one person at one touch. */
export type ContactOutcomes = { saved: boolean; filled: boolean; healed: boolean };

export function emptyOutcomes(): ContactOutcomes {
  return { saved: false, filled: false, healed: false };
}

function parseFlag(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

function readOutcomes(input: { saved?: unknown; filled?: unknown; healed?: unknown }): ContactOutcomes {
  return {
    saved: parseFlag(input.saved),
    filled: parseFlag(input.filled),
    healed: parseFlag(input.healed),
  };
}

/** The outcomes that happened, written out: "Saved, Filled" or null. */
export function outcomesLabel(outcomes: ContactOutcomes): string | null {
  const parts = [
    outcomes.saved ? "Saved" : null,
    outcomes.filled ? "Filled" : null,
    outcomes.healed ? "Healed" : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(", ") : null;
}

// ─── People met at an outreach ─────────────────────────────────────────────

export type ContactInput = {
  name: string;
  phone: string | null;
  note: string | null;
};

export function normaliseContactInput(input: {
  name?: unknown;
  phone?: unknown;
  note?: unknown;
}): { ok: true; value: ContactInput } | { ok: false; error: string } {
  const name =
    typeof input.name === "string" ? input.name.replace(/\s+/g, " ").trim() : "";
  if (name.length < 2) {
    return { ok: false, error: "Enter the person's name." };
  }
  if (name.length > CONTACT_NAME_MAX) {
    return {
      ok: false,
      error: `Keep the name under ${CONTACT_NAME_MAX} characters.`,
    };
  }

  const phone =
    typeof input.phone === "string" ? input.phone.replace(/\s+/g, " ").trim() : "";
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (
      phone.length > CONTACT_PHONE_MAX ||
      !/^[+\d][\d\s().-]*$/.test(phone) ||
      digits.length < 7
    ) {
      return {
        ok: false,
        error: "Enter a valid phone number, or leave it blank.",
      };
    }
  }

  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > CONTACT_NOTE_MAX) {
    return {
      ok: false,
      error: `Keep the note under ${CONTACT_NOTE_MAX} characters.`,
    };
  }

  return { ok: true, value: { name, phone: phone || null, note: note || null } };
}

/** One row of the "People you met" step in the activity form. */
export type ContactRowInput = {
  /** Set for a person already saved, so their details are corrected in place. */
  id?: number | null;
  name?: unknown;
  phone?: unknown;
  note?: unknown;
  saved?: unknown;
  filled?: unknown;
  healed?: unknown;
  /** Ticked when the person should be followed up, which starts their discipleship status. */
  wantsFollowUp?: unknown;
};

export type ContactRow = ContactInput & {
  id: number | null;
  outcomes: ContactOutcomes;
  wantsFollowUp: boolean;
};

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

function positiveId(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Reads the people rows sent with an outreach. A row left completely empty is
 * skipped (which also removes a saved person whose row was cleared); any
 * other row must be valid, and an error names the row it came from.
 */
export function normaliseContactRows(
  rows: ContactRowInput[],
): { ok: true; value: ContactRow[] } | { ok: false; error: string } {
  const people: ContactRow[] = [];

  for (const [index, row] of rows.entries()) {
    if (isBlank(row.name) && isBlank(row.phone) && isBlank(row.note)) continue;

    const parsed = normaliseContactInput(row);
    if (!parsed.ok) {
      return { ok: false, error: `Person ${index + 1}: ${parsed.error}` };
    }
    people.push({
      ...parsed.value,
      id: positiveId(row.id),
      outcomes: readOutcomes(row),
      wantsFollowUp: parseFlag(row.wantsFollowUp),
    });
  }

  if (people.length > CONTACTS_PER_DAY_MAX) {
    return {
      ok: false,
      error: `You can add up to ${CONTACTS_PER_DAY_MAX} people for one day.`,
    };
  }
  return { ok: true, value: people };
}

// ─── People followed up in a follow-up activity ────────────────────────────

export type FollowUpRowInput = {
  contactId?: unknown;
  kind?: unknown;
  saved?: unknown;
  filled?: unknown;
  healed?: unknown;
  note?: unknown;
};

export type FollowUpRow = {
  contactId: number;
  kind: LoggableInteractionKind;
  outcomes: ContactOutcomes;
  note: string | null;
};

/**
 * Reads the people rows sent with a follow-up activity. A row without a
 * person is skipped; each person may appear once; every row needs how they
 * were followed up.
 */
export function normaliseFollowUpRows(
  rows: FollowUpRowInput[],
): { ok: true; value: FollowUpRow[] } | { ok: false; error: string } {
  const people: FollowUpRow[] = [];
  const seen = new Set<number>();

  for (const [index, row] of rows.entries()) {
    const contactId = positiveId(row.contactId);
    if (contactId === null) continue;
    if (seen.has(contactId)) {
      return { ok: false, error: `Person ${index + 1} is listed twice.` };
    }
    if (!isLoggableInteractionKind(row.kind)) {
      return { ok: false, error: `Person ${index + 1}: Choose how you followed up.` };
    }
    const note = typeof row.note === "string" ? row.note.trim() : "";
    if (note.length > INTERACTION_NOTE_MAX) {
      return {
        ok: false,
        error: `Person ${index + 1}: Keep the note under ${INTERACTION_NOTE_MAX} characters.`,
      };
    }
    seen.add(contactId);
    people.push({ contactId, kind: row.kind, outcomes: readOutcomes(row), note: note || null });
  }

  if (people.length > CONTACTS_PER_DAY_MAX) {
    return {
      ok: false,
      error: `You can add up to ${CONTACTS_PER_DAY_MAX} people for one day.`,
    };
  }
  return { ok: true, value: people };
}

// ─── Logging and editing from the people list ──────────────────────────────

export type InteractionInput = {
  kind: LoggableInteractionKind;
  interactionDate: string;
  outcomes: ContactOutcomes;
  note: string | null;
};

/** Reads a follow-up logged from the people list. The date can be today or earlier. */
export function normaliseInteractionInput(
  input: {
    kind?: unknown;
    dateKey?: unknown;
    saved?: unknown;
    filled?: unknown;
    healed?: unknown;
    note?: unknown;
  },
  todayKey: string,
): { ok: true; value: InteractionInput } | { ok: false; error: string } {
  if (!isLoggableInteractionKind(input.kind)) {
    return { ok: false, error: "Choose how you followed up." };
  }
  if (!isDateKey(input.dateKey) || input.dateKey > todayKey) {
    return { ok: false, error: "Enter a date no later than today." };
  }
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > INTERACTION_NOTE_MAX) {
    return {
      ok: false,
      error: `Keep the note under ${INTERACTION_NOTE_MAX} characters.`,
    };
  }
  return {
    ok: true,
    value: {
      kind: input.kind,
      interactionDate: input.dateKey,
      outcomes: readOutcomes(input),
      note: note || null,
    },
  };
}

export type ContactUpdate = {
  salvationStatus: SalvationStatus;
  discipleshipStatus: DiscipleshipStatus;
  followUpPlan: string | null;
  nextFollowUpDate: string | null;
};

/** Reads the "Edit details" form: both statuses, the plan and the next date. */
export function normaliseContactUpdate(input: {
  salvationStatus?: unknown;
  discipleshipStatus?: unknown;
  followUpPlan?: unknown;
  nextFollowUpDate?: unknown;
}): { ok: true; value: ContactUpdate } | { ok: false; error: string } {
  if (!isSalvationStatus(input.salvationStatus)) {
    return { ok: false, error: "Choose their salvation status." };
  }
  if (!isDiscipleshipStatus(input.discipleshipStatus)) {
    return { ok: false, error: "Choose their discipleship status." };
  }
  const plan = typeof input.followUpPlan === "string" ? input.followUpPlan.trim() : "";
  if (plan.length > FOLLOW_UP_PLAN_MAX) {
    return {
      ok: false,
      error: `Keep the plan under ${FOLLOW_UP_PLAN_MAX} characters.`,
    };
  }
  const next = typeof input.nextFollowUpDate === "string" ? input.nextFollowUpDate.trim() : "";
  if (next && !isDateKey(next)) {
    return { ok: false, error: "Enter a real date for the next follow-up." };
  }
  return {
    ok: true,
    value: {
      salvationStatus: input.salvationStatus,
      discipleshipStatus: input.discipleshipStatus,
      followUpPlan: plan || null,
      nextFollowUpDate: next || null,
    },
  };
}

export function normaliseFollowUpNote(value: unknown): string | null {
  const note = typeof value === "string" ? value.trim() : "";
  return note ? note.slice(0, FOLLOW_UP_NOTE_MAX) : null;
}

/** A `tel:` link for a stored phone number, or null when there is none. */
export function phoneHref(phone: string | null): string | null {
  if (!phone) return null;
  const dialable = phone.replace(/[^\d+]/g, "");
  return dialable ? `tel:${dialable}` : null;
}

// ─── Who may see and change a person ───────────────────────────────────────

/**
 * Who may see a person met in ministry, log a follow-up and edit their
 * details: the member who met them, an admin, or the pastor assigned to one
 * of that member's location groups.
 */
export function canSeeOutreachContact(
  viewer: { userId: string; isAdmin: boolean; managedUnitIds: number[] },
  owner: { userId: string; unitIds: number[] },
): boolean {
  if (viewer.userId === owner.userId || viewer.isAdmin) return true;
  return owner.unitIds.some((unitId) => viewer.managedUnitIds.includes(unitId));
}

/**
 * Who may delete a logged interaction: whoever logged it, or an admin. A
 * `met` entry belongs to the outreach it came from and is never deleted here.
 */
export function canDeleteInteraction(
  viewer: { userId: string; isAdmin: boolean },
  interaction: { userId: string | null; kind: InteractionKind },
): boolean {
  if (interaction.kind === "met") return false;
  if (viewer.isAdmin) return true;
  return interaction.userId !== null && interaction.userId === viewer.userId;
}

/** True when a next follow-up date is set and has arrived. */
export function isFollowUpDue(
  contact: { nextFollowUpDate?: string | null },
  todayKey: string,
): boolean {
  return contact.nextFollowUpDate != null && contact.nextFollowUpDate <= todayKey;
}

// ─── Searching and sorting a list of people ────────────────────────────────

export type ContactStatusFilter = "all" | "pending" | "done" | "due";
export type SalvationFilter = "any" | SalvationStatus;
export type DiscipleshipFilter = "any" | DiscipleshipStatus;
export type ContactSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "pending_first"
  | "next_follow_up"
  | "member";

export const CONTACT_STATUS_LABELS: Record<ContactStatusFilter, string> = {
  all: "Everyone",
  pending: "To follow up",
  done: "Followed up",
  due: "Follow-up due",
};

export const CONTACT_SORT_LABELS: Record<ContactSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name A to Z",
  name_desc: "Name Z to A",
  pending_first: "To follow up first",
  next_follow_up: "Next follow-up first",
  member: "Member A to Z",
};

/** The sorts offered to a member; staff lists add "member". */
export const MEMBER_CONTACT_SORTS: ContactSort[] = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
  "pending_first",
  "next_follow_up",
];

type ListedContact = {
  id: number;
  metDate: string;
  name: string;
  phone: string | null;
  note: string | null;
  followedUpAt: string | null;
  salvationStatus?: SalvationStatus;
  discipleshipStatus?: DiscipleshipStatus;
  nextFollowUpDate?: string | null;
  /** Present on staff lists: the member who met the person. */
  memberName?: string;
};

function newestFirst(a: ListedContact, b: ListedContact): number {
  return b.metDate.localeCompare(a.metDate) || b.id - a.id;
}

function nextFollowUpFirst(a: ListedContact, b: ListedContact): number {
  const left = a.nextFollowUpDate ?? null;
  const right = b.nextFollowUpDate ?? null;
  if (left === null && right === null) return newestFirst(a, b);
  if (left === null) return 1;
  if (right === null) return -1;
  return left.localeCompare(right) || newestFirst(a, b);
}

/**
 * Filters by search text, follow-up status and the two statuses, then sorts.
 * The search matches the name, note and (on staff lists) the member who met
 * them, and matches a phone number however it was spaced or punctuated.
 */
export function filterAndSortContacts<T extends ListedContact>(
  contacts: T[],
  options: {
    query: string;
    status: ContactStatusFilter;
    sort: ContactSort;
    salvation?: SalvationFilter;
    discipleship?: DiscipleshipFilter;
    /** Needed for the "due" filter; without it any set date counts as due. */
    today?: string;
    /** Ids that stay listed whatever the filters say; the search still applies. */
    keep?: ReadonlySet<number>;
  },
): T[] {
  const text = options.query.trim().toLowerCase();
  const digits = text.replace(/\D/g, "");
  const salvation = options.salvation ?? "any";
  const discipleship = options.discipleship ?? "any";
  const today = options.today ?? "9999-12-31";

  const matches = (contact: T) => {
    if (!options.keep?.has(contact.id)) {
      if (options.status === "pending" && contact.followedUpAt !== null) return false;
      if (options.status === "done" && contact.followedUpAt === null) return false;
      if (options.status === "due" && !isFollowUpDue(contact, today)) return false;
      if (salvation !== "any" && contact.salvationStatus !== salvation) return false;
      if (discipleship !== "any" && contact.discipleshipStatus !== discipleship) {
        return false;
      }
    }
    if (!text) return true;
    if (
      [contact.name, contact.note, contact.memberName, contact.phone].some(
        (field) => field?.toLowerCase().includes(text),
      )
    ) {
      return true;
    }
    return (
      digits.length >= 3 &&
      (contact.phone ?? "").replace(/\D/g, "").includes(digits)
    );
  };

  const compare = (a: T, b: T): number => {
    switch (options.sort) {
      case "oldest":
        return -newestFirst(a, b);
      case "name_asc":
        return a.name.localeCompare(b.name) || newestFirst(a, b);
      case "name_desc":
        return b.name.localeCompare(a.name) || newestFirst(a, b);
      case "pending_first":
        return (
          Number(a.followedUpAt !== null) - Number(b.followedUpAt !== null) ||
          newestFirst(a, b)
        );
      case "next_follow_up":
        return nextFollowUpFirst(a, b);
      case "member":
        return (
          (a.memberName ?? "").localeCompare(b.memberName ?? "") ||
          newestFirst(a, b)
        );
      default:
        return newestFirst(a, b);
    }
  };

  return contacts.filter(matches).sort(compare);
}
