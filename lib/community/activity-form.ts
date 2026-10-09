import {
  ACTIVITY_PLACE_MAX,
  ACTIVITY_TITLE_MAX,
  activityFields,
  activityKindConfig,
  activityKindLabel,
  activityWhere,
  parsePlatform,
  type ActivityKind,
  type OutreachMode,
} from "./ministry-activities";
import {
  MINISTRY_COUNT_MAX,
  MINISTRY_FIELDS,
  MINISTRY_NOTE_MAX,
  ministryFieldLabel,
  type MinistryFieldKey,
  type MinistryNumbers,
} from "./ministry-report";
import {
  CONTACTS_PER_DAY_MAX,
  INTERACTION_NOTE_MAX,
  normaliseContactInput,
  type ContactOutcomes,
  type LoggableInteractionKind,
} from "./outreach-contacts";

/**
 * Rules for the step-by-step activity form: which steps a kind has, what the
 * form holds while it is being filled in, what each step checks before
 * moving on, and how a saved activity is read into the form and back out.
 * Pure so the stepper is unit-tested without rendering it.
 */

export type StepId = "kind" | "where" | "numbers" | "people" | "review";

export const STEP_TITLES: Record<StepId, string> = {
  kind: "What did you do?",
  where: "Where",
  numbers: "How many people?",
  people: "People",
  review: "Note and review",
};

/**
 * The steps for a kind, in order. A follow-up asks for its people before its
 * numbers so the count can be filled in from them; an outreach asks for its
 * numbers first and then names the people where it can.
 */
export function stepsFor(kind: ActivityKind | null): StepId[] {
  if (!kind) return ["kind"];
  const config = activityKindConfig(kind);
  if (config.people === "follow_up") return ["kind", "people", "numbers", "review"];
  if (config.people === "met") return ["kind", "where", "numbers", "people", "review"];
  return ["kind", "where", "numbers", "review"];
}

// ─── What the form holds ───────────────────────────────────────────────────

export type PersonDraft = {
  key: string;
  /** Set once the person is saved, so they are corrected in place. */
  id: number | null;
  name: string;
  phone: string;
  note: string;
  saved: boolean;
  filled: boolean;
  healed: boolean;
  wantsFollowUp: boolean;
};

export type FollowUpPick = {
  contactId: number;
  name: string;
  phone: string | null;
  kind: LoggableInteractionKind;
  saved: boolean;
  filled: boolean;
  healed: boolean;
  note: string;
};

export type ActivityDraft = {
  dateKey: string;
  kind: ActivityKind | null;
  title: string;
  mode: OutreachMode | null;
  /** A key from OUTREACH_PLATFORMS, or "" until chosen. */
  platform: string;
  platformOther: string;
  location: string;
  /** Numbers stay as typed until they are saved. */
  numbers: Record<MinistryFieldKey, string>;
  note: string;
  people: PersonDraft[];
  followUps: FollowUpPick[];
};

export function blankNumbers(): Record<MinistryFieldKey, string> {
  const numbers = {} as Record<MinistryFieldKey, string>;
  for (const field of MINISTRY_FIELDS) numbers[field.key] = "";
  return numbers;
}

export function blankPerson(key: string): PersonDraft {
  return {
    key,
    id: null,
    name: "",
    phone: "",
    note: "",
    saved: false,
    filled: false,
    healed: false,
    wantsFollowUp: false,
  };
}

export function emptyDraft(dateKey: string): ActivityDraft {
  return {
    dateKey,
    kind: null,
    title: "",
    mode: null,
    platform: "",
    platformOther: "",
    location: "",
    numbers: blankNumbers(),
    note: "",
    people: [],
    followUps: [],
  };
}

/** Clears everything the previous kind asked for, keeping the name and note. */
export function withKind(draft: ActivityDraft, kind: ActivityKind): ActivityDraft {
  return {
    ...draft,
    kind,
    mode: null,
    platform: "",
    platformOther: "",
    location: "",
    numbers: blankNumbers(),
    people: [],
    followUps: [],
  };
}

export type SavedActivity = MinistryNumbers & {
  activityDate: string;
  kind: ActivityKind;
  title: string | null;
  mode: OutreachMode | null;
  platform: string | null;
  location: string | null;
  note: string | null;
  people: Array<{
    id: number;
    name: string;
    phone: string | null;
    note: string | null;
    outcomes: ContactOutcomes;
    discipleshipStatus: string;
  }>;
  /** People followed up in a follow-up. Named apart from the `followUps` count. */
  followUpPeople: Array<{
    contactId: number;
    name: string;
    phone: string | null;
    kind: string;
    outcomes: ContactOutcomes;
    note: string | null;
  }>;
};

/** A saved activity as the form holds it. Numbers the kind does not show stay blank. */
export function draftFromActivity(activity: SavedActivity): ActivityDraft {
  const shown = activityFields(activity.kind, activity.mode).shown;
  const numbers = blankNumbers();
  for (const key of shown) numbers[key] = String(activity[key]);
  const platform = parsePlatform(activity.platform);

  return {
    dateKey: activity.activityDate,
    kind: activity.kind,
    title: activity.title ?? "",
    mode: activity.mode,
    platform: platform?.key ?? "",
    platformOther: platform?.detail ?? "",
    location: activity.location ?? "",
    numbers,
    note: activity.note ?? "",
    people: activity.people.map((person) => ({
      key: `saved-${person.id}`,
      id: person.id,
      name: person.name,
      phone: person.phone ?? "",
      note: person.note ?? "",
      ...person.outcomes,
      wantsFollowUp: person.discipleshipStatus === "following_up",
    })),
    followUps: activity.followUpPeople.map((row) => ({
      contactId: row.contactId,
      name: row.name,
      phone: row.phone,
      kind: (row.kind === "met" || row.kind === "follow_up"
        ? "other"
        : row.kind) as LoggableInteractionKind,
      ...row.outcomes,
      note: row.note ?? "",
    })),
  };
}

/** Exactly what `saveMinistryActivity` takes. */
export function toSaveInput(draft: ActivityDraft, activityId?: number | null) {
  const shown = draft.kind ? activityFields(draft.kind, draft.mode).shown : [];
  const values: Partial<Record<MinistryFieldKey, string>> = {};
  for (const key of shown) values[key] = draft.numbers[key];

  return {
    activityId: activityId ?? null,
    dateKey: draft.dateKey,
    kind: draft.kind ?? "",
    title: draft.title,
    mode: draft.mode ?? undefined,
    platform: draft.platform,
    platformOther: draft.platformOther,
    location: draft.location,
    values,
    note: draft.note,
    people: draft.people.map((person) => ({
      id: person.id,
      name: person.name,
      phone: person.phone,
      note: person.note,
      saved: person.saved,
      filled: person.filled,
      healed: person.healed,
      wantsFollowUp: person.wantsFollowUp,
    })),
    followUps: draft.followUps.map((row) => ({
      contactId: row.contactId,
      kind: row.kind,
      saved: row.saved,
      filled: row.filled,
      healed: row.healed,
      note: row.note,
    })),
  };
}

// ─── Checking a step before moving on ──────────────────────────────────────

/** Messages keyed by field; the keys become element ids through `fieldId`. */
export type StepErrors = Record<string, string>;

export function fieldId(key: string): string {
  return `activity-${key}`;
}

function blank(value: string): boolean {
  return value.trim() === "";
}

export function validateStep(step: StepId, draft: ActivityDraft): StepErrors {
  const errors: StepErrors = {};
  if (step === "kind") {
    if (!draft.kind) errors.kind = "Choose what you did.";
    return errors;
  }
  if (!draft.kind) return errors;
  const config = activityKindConfig(draft.kind);

  if (step === "where") {
    if (config.key === "outreach") {
      if (!draft.mode) {
        errors.mode = "Choose online, offline or both.";
      } else {
        if (draft.mode !== "offline") {
          if (!draft.platform) errors.platform = "Choose the platform.";
          else if (draft.platform === "other" && blank(draft.platformOther)) {
            errors.platformOther = "Say which platform.";
          } else if (draft.platformOther.trim().length > ACTIVITY_PLACE_MAX) {
            errors.platformOther = `Keep the platform name under ${ACTIVITY_PLACE_MAX} characters.`;
          }
        }
        if (draft.mode !== "online" && blank(draft.location)) {
          errors.location = "Enter where you were.";
        }
      }
    } else {
      if (config.titleRequired && blank(draft.title)) {
        errors.title = "Give this activity a short name.";
      }
    }
    if (draft.title.trim().length > ACTIVITY_TITLE_MAX) {
      errors.title = `Keep the name under ${ACTIVITY_TITLE_MAX} characters.`;
    }
    if (draft.location.trim().length > ACTIVITY_PLACE_MAX) {
      errors.location = `Keep the place under ${ACTIVITY_PLACE_MAX} characters.`;
    }
    return errors;
  }

  if (step === "numbers") {
    const rules = activityFields(draft.kind, draft.mode);
    for (const key of rules.shown) {
      const value = draft.numbers[key].trim();
      const label = ministryFieldLabel(key);
      if (value === "") {
        if (rules.required.includes(key)) {
          errors[`numbers.${key}`] = `Enter a number for "${label}". Use 0 if there were none.`;
        }
        continue;
      }
      if (!/^\d+$/.test(value) || Number(value) > MINISTRY_COUNT_MAX) {
        errors[`numbers.${key}`] =
          `"${label}" must be a whole number from 0 to ${MINISTRY_COUNT_MAX.toLocaleString("en-GB")}.`;
      }
    }
    return errors;
  }

  if (step === "people") {
    if (config.people === "met") {
      const filled = draft.people.filter(
        (person) => !(blank(person.name) && blank(person.phone) && blank(person.note)),
      );
      if (filled.length > CONTACTS_PER_DAY_MAX) {
        errors.people = `You can add up to ${CONTACTS_PER_DAY_MAX} people for one day.`;
      }
      for (const person of filled) {
        const parsed = normaliseContactInput(person);
        if (!parsed.ok) errors[`people.${person.key}`] = parsed.error;
      }
    }
    if (config.people === "follow_up") {
      if (draft.followUps.length > CONTACTS_PER_DAY_MAX) {
        errors.followUps = `You can add up to ${CONTACTS_PER_DAY_MAX} people for one day.`;
      }
      for (const row of draft.followUps) {
        if (row.note.trim().length > INTERACTION_NOTE_MAX) {
          errors[`followUps.${row.contactId}`] =
            `Keep the note under ${INTERACTION_NOTE_MAX} characters.`;
        }
      }
    }
    return errors;
  }

  if (draft.note.trim().length > MINISTRY_NOTE_MAX) {
    errors.note = `Keep the note under ${MINISTRY_NOTE_MAX} characters.`;
  }
  return errors;
}

/** The element id of the first field with a message, or null. */
export function firstErrorId(errors: StepErrors): string | null {
  const [key] = Object.keys(errors);
  return key ? fieldId(key) : null;
}

/** True when every step before `index` passes, so the form may jump there. */
export function canJumpTo(steps: StepId[], index: number, draft: ActivityDraft): boolean {
  return steps
    .slice(0, index)
    .every((step) => Object.keys(validateStep(step, draft)).length === 0);
}

// ─── Help between steps ────────────────────────────────────────────────────

/**
 * Fills blank numbers of a follow-up from the people picked: how many were
 * followed up and what happened. Typed numbers are left alone.
 */
export function prefillFromFollowUps(draft: ActivityDraft): ActivityDraft {
  if (draft.kind !== "follow_up") return draft;
  const picks = draft.followUps;
  const numbers = { ...draft.numbers };
  const fill = (key: MinistryFieldKey, count: number) => {
    if (blank(numbers[key]) && count > 0) numbers[key] = String(count);
  };
  fill("followUps", picks.length);
  fill("saved", picks.filter((row) => row.saved).length);
  fill("filled", picks.filter((row) => row.filled).length);
  fill("healed", picks.filter((row) => row.healed).length);
  return { ...draft, numbers };
}

/**
 * A warning when more people are ticked as saved than the number entered,
 * so the member goes back and corrects it. Null when all is well.
 */
export function savedMismatch(draft: ActivityDraft): string | null {
  const ticked = draft.people.filter((person) => person.saved).length;
  const entered = Number(draft.numbers.saved.trim() || "0");
  if (!Number.isInteger(entered) || ticked <= entered) return null;
  return `${ticked} people are marked Saved but you entered ${entered}. Go back to the numbers to correct it.`;
}

// ─── Describing an activity in a line ──────────────────────────────────────

function plural(count: number, noun: string, pluralNoun = `${noun}s`): string {
  return `${count} ${count === 1 ? noun : pluralNoun}`;
}

/** "Evangelism", or "Teaching meeting · Youth fellowship". */
export function activityTitle(activity: { kind: ActivityKind; title: string | null }): string {
  const label = activityKindLabel(activity.kind);
  return activity.title ? `${label} · ${activity.title}` : label;
}

/** "12 reached · 3 saved · 2 follow-ups", "40 present · 2 saved", "5 follow-ups · 1 saved". */
export function activityKeyNumbers(
  activity: MinistryNumbers & { kind: ActivityKind },
): string {
  const parts: string[] = [];
  const config = activityKindConfig(activity.kind);
  if (config.key === "outreach") {
    parts.push(`${activity.reachedOnline + activity.reachedOffline} reached`);
  } else if (config.people === "follow_up") {
    parts.push(plural(activity.followUps, "follow-up"));
  } else {
    parts.push(`${activity.attendance} present`);
  }
  if (activity.saved > 0) parts.push(`${activity.saved} saved`);
  if (activity.filled > 0) parts.push(`${activity.filled} filled`);
  if (activity.healed > 0) parts.push(`${activity.healed} healed`);
  if (config.key !== "follow_up" && activity.followUps > 0) {
    parts.push(plural(activity.followUps, "follow-up"));
  }
  return parts.join(" · ");
}

export { activityWhere };
