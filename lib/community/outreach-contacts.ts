/**
 * Rules for the people a member meets in outreach. Pure so the validation and
 * the "who may see this person" rule are unit-tested.
 *
 * These are people outside Pleros. Their name and phone number go only to the
 * member who met them, the pastor assigned to that member's location group,
 * and admins — never to a discipler or other learners.
 */

export const CONTACT_NAME_MAX = 80;
export const CONTACT_PHONE_MAX = 30;
export const CONTACT_NOTE_MAX = 300;
export const FOLLOW_UP_NOTE_MAX = 300;
/** People one member may add for a single day. */
export const CONTACTS_PER_DAY_MAX = 50;

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

/** One row of the "People you met" group in the report form. */
export type ContactRowInput = {
  /** Set for a person already saved, so their details are corrected in place. */
  id?: number | null;
  name?: unknown;
  phone?: unknown;
  note?: unknown;
};

export type ContactRow = ContactInput & { id: number | null };

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

/**
 * Reads the people rows sent with a report. A row left completely empty is
 * skipped (which also removes a saved person whose row was cleared); any other
 * row must be valid, and an error names the row it came from.
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
      id: typeof row.id === "number" && Number.isInteger(row.id) && row.id > 0
        ? row.id
        : null,
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

/**
 * Who may see a person met in outreach and mark them followed up: the member
 * who met them, an admin, or the pastor assigned to one of that member's
 * location groups.
 */
export function canSeeOutreachContact(
  viewer: { userId: string; isAdmin: boolean; managedUnitIds: number[] },
  owner: { userId: string; unitIds: number[] },
): boolean {
  if (viewer.userId === owner.userId || viewer.isAdmin) return true;
  return owner.unitIds.some((unitId) => viewer.managedUnitIds.includes(unitId));
}

// ─── Searching and sorting a list of people ────────────────────────────────

export type ContactStatusFilter = "all" | "pending" | "done";
export type ContactSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "pending_first"
  | "member";

export const CONTACT_STATUS_LABELS: Record<ContactStatusFilter, string> = {
  all: "Everyone",
  pending: "To follow up",
  done: "Followed up",
};

export const CONTACT_SORT_LABELS: Record<ContactSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name A to Z",
  name_desc: "Name Z to A",
  pending_first: "To follow up first",
  member: "Member A to Z",
};

/** The sorts offered to a member; staff lists add "member". */
export const MEMBER_CONTACT_SORTS: ContactSort[] = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
  "pending_first",
];

type ListedContact = {
  id: number;
  metDate: string;
  name: string;
  phone: string | null;
  note: string | null;
  followedUpAt: string | null;
  /** Present on staff lists: the member who met the person. */
  memberName?: string;
};

function newestFirst(a: ListedContact, b: ListedContact): number {
  return b.metDate.localeCompare(a.metDate) || b.id - a.id;
}

/**
 * Filters by search text and follow-up status, then sorts. The search matches
 * the name, note and (on staff lists) the member who met them, and matches a
 * phone number however it was spaced or punctuated.
 */
export function filterAndSortContacts<T extends ListedContact>(
  contacts: T[],
  options: {
    query: string;
    status: ContactStatusFilter;
    sort: ContactSort;
    /** Ids that stay listed whatever the status filter says; the search still applies. */
    keep?: ReadonlySet<number>;
  },
): T[] {
  const text = options.query.trim().toLowerCase();
  const digits = text.replace(/\D/g, "");

  const matches = (contact: T) => {
    if (!options.keep?.has(contact.id)) {
      if (options.status === "pending" && contact.followedUpAt !== null) return false;
      if (options.status === "done" && contact.followedUpAt === null) return false;
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
