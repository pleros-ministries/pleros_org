import {
  prefillFromFollowUps,
  stepsFor,
  toSaveInput,
  validateStep,
  type ActivityDraft,
} from "@/lib/community/activity-form";
import {
  ACTIVITIES_PER_DAY_MAX,
  activityKindLabel,
  normaliseActivityInput,
} from "@/lib/community/ministry-activities";
import { MINISTRY_WRITE_WINDOW_MESSAGE, type DayActivity } from "@/lib/community/ministry-report";
import { normaliseContactInput } from "@/lib/community/outreach-contacts";

import {
  activitiesFor,
  categoryOfKind,
  dayReport,
  isWritableDay,
  MEETING_KINDS,
} from "./daily-report";
import {
  DEMO_GROUP_MAX,
  DEMO_GROUP_NAME_MAX,
  DEMO_GROUP_NAME_MIN,
  DEMO_GROUPS_LED_MAX,
  seeded,
} from "./fixtures";
import {
  findPerson,
  groupMemberIds,
  joinedGroup,
  ledGroups,
  openLedGroups,
  oversees,
} from "./scope";
import type {
  DemoActivity,
  DemoContact,
  DemoState,
  MeetingRole,
  Outcome,
  ReportCategory,
} from "./types";

/**
 * Every change the demo can make, as pure functions from one state to the
 * next. They re-check ownership, scope and the date window the way a server
 * action would, so the UI cannot talk its way past them. None of them sends,
 * schedules or stores anything outside the returned state.
 */

export const MEETING_TAUGHT_MAX = 200;

const WINDOW_ERROR = MINISTRY_WRITE_WINDOW_MESSAGE;

function fail(error: string): Outcome {
  return { ok: false, error };
}

function done(state: DemoState, message?: string): Outcome {
  return { ok: true, state, message };
}

function withDeclaration(
  state: DemoState,
  personId: string,
  dateKey: string,
  category: ReportCategory,
  value: "nil" | "confirmed" | null,
): DemoState {
  const person = { ...(state.declarations[personId] ?? {}) };
  const day = { ...(person[dateKey] ?? {}) };
  if (value) day[category] = value;
  else delete day[category];
  person[dateKey] = day;
  return { ...state, declarations: { ...state.declarations, [personId]: person } };
}

// ─── Activities ────────────────────────────────────────────────────────────

export type SaveActivityInput = {
  viewerId: string;
  draft: ActivityDraft;
  activityId?: number | null;
  meetingRole?: MeetingRole | null;
  taught?: string;
};

export function saveActivity(state: DemoState, input: SaveActivityInput): Outcome {
  const { viewerId } = input;
  const draft = prefillFromFollowUps(input.draft);
  if (!findPerson(state, viewerId)) return fail("Choose who you are in the demo first.");
  if (!draft.kind) return fail("Choose what you did.");
  if (!isWritableDay(draft.dateKey, state.today)) return fail(WINDOW_ERROR);

  const existing = input.activityId
    ? state.activities.find((activity) => activity.id === input.activityId)
    : undefined;
  if (input.activityId) {
    if (!existing || existing.personId !== viewerId) return fail("That activity is not yours to change.");
    if (existing.kind !== draft.kind || existing.activityDate !== draft.dateKey) {
      return fail("An activity's kind and day never change. Remove it and add it again.");
    }
  } else if (
    activitiesFor(state, viewerId, draft.dateKey).length >= ACTIVITIES_PER_DAY_MAX
  ) {
    return fail(`You can log up to ${ACTIVITIES_PER_DAY_MAX} activities for one day.`);
  }

  for (const step of stepsFor(draft.kind)) {
    const errors = validateStep(step, draft);
    const first = Object.values(errors)[0];
    if (first) return fail(first);
  }

  const isMeeting = MEETING_KINDS.includes(draft.kind);
  if (isMeeting && !input.meetingRole) return fail("Choose your role in this meeting.");
  const taught = isMeeting && input.meetingRole === "leader" ? (input.taught ?? "").trim() : "";
  if (taught.length > MEETING_TAUGHT_MAX) {
    return fail(`Keep what was taught under ${MEETING_TAUGHT_MAX} characters.`);
  }

  const save = toSaveInput(draft, input.activityId);
  const parsed = normaliseActivityInput({
    ...save,
    peopleCount: draft.followUps.length,
    allowRetired: Boolean(existing),
  });
  if (!parsed.ok) return fail(parsed.error);

  let next = state;
  let nextId = state.nextId;

  // People met at an evangelism activity become the member's own contacts.
  const contactIds: number[] = [];
  let contacts = [...state.contacts];
  if (draft.kind === "outreach") {
    const filled = draft.people.filter(
      (row) => row.name.trim() || row.phone.trim() || row.note.trim(),
    );
    for (const row of filled) {
      const contact = normaliseContactInput(row);
      if (!contact.ok) return fail(contact.error);
      const owned = row.id !== null
        ? contacts.find((item) => item.id === row.id && item.ownerId === viewerId)
        : undefined;
      const fields: Partial<DemoContact> = {
        name: contact.value.name,
        phone: contact.value.phone,
        note: contact.value.note,
        outcomes: { saved: row.saved, filled: row.filled, healed: row.healed },
        salvationStatus: row.saved ? "saved" : (owned?.salvationStatus ?? "unknown"),
        discipleshipStatus: row.wantsFollowUp
          ? owned?.discipleshipStatus === "not_started" || !owned
            ? "following_up"
            : owned.discipleshipStatus
          : (owned?.discipleshipStatus ?? "not_started"),
      };
      if (owned) {
        contacts = contacts.map((item) => (item.id === owned.id ? { ...item, ...fields } : item));
        contactIds.push(owned.id);
      } else {
        const id = nextId++;
        contacts.push({
          id,
          ownerId: viewerId,
          metDate: draft.dateKey,
          followedUpAt: null,
          invite: null,
          personId: null,
          salvationStatus: "unknown",
          discipleshipStatus: "not_started",
          outcomes: { saved: false, filled: false, healed: false },
          name: "",
          phone: null,
          note: null,
          ...fields,
        });
        contactIds.push(id);
      }
    }
    // A row removed from an edited activity removes that person, unless they have joined a group.
    for (const removedId of existing?.contactIds.filter((id) => !contactIds.includes(id)) ?? []) {
      const removed = contacts.find((item) => item.id === removedId);
      if (removed?.personId) {
        return fail(`${removed.name} has joined a group, so they stay on your list.`);
      }
      contacts = contacts.filter((item) => item.id !== removedId);
    }
  }

  // Follow-ups are logged against the member's own contacts and never change group membership.
  const followUpPeople: DemoActivity["followUpPeople"] = [];
  if (draft.kind === "follow_up") {
    for (const pick of draft.followUps) {
      const owned = contacts.find((item) => item.id === pick.contactId && item.ownerId === viewerId);
      if (!owned) return fail("You can only follow up people you met.");
      followUpPeople.push({
        contactId: pick.contactId,
        kind: pick.kind,
        outcomes: { saved: pick.saved, filled: pick.filled, healed: pick.healed },
        note: pick.note.trim() || null,
      });
      contacts = contacts.map((item) =>
        item.id === pick.contactId
          ? {
              ...item,
              followedUpAt: item.followedUpAt ?? `${draft.dateKey}T12:00:00.000Z`,
              discipleshipStatus:
                item.discipleshipStatus === "not_started" ? "following_up" : item.discipleshipStatus,
            }
          : item,
      );
    }
  }

  const activity: DemoActivity = {
    ...parsed.value,
    id: existing?.id ?? nextId++,
    personId: viewerId,
    activityDate: draft.dateKey,
    meetingRole: isMeeting ? (input.meetingRole ?? null) : null,
    taught: taught || null,
    contactIds,
    followUpPeople,
    createdAt: existing?.createdAt ?? `${draft.dateKey}T12:00:00.000Z`,
  };

  next = {
    ...next,
    contacts,
    nextId,
    activities: existing
      ? next.activities.map((item) => (item.id === existing.id ? activity : item))
      : [...next.activities, activity],
  };
  // Activity replaces any earlier "nothing to report" for that category.
  next = withDeclaration(next, viewerId, draft.dateKey, categoryOfKind(draft.kind), null);
  return done(next, `${activityKindLabel(draft.kind)} ${existing ? "updated" : "saved"}.`);
}

export function removeActivity(state: DemoState, viewerId: string, activityId: number): Outcome {
  const activity = state.activities.find((item) => item.id === activityId);
  if (!activity || activity.personId !== viewerId) return fail("That activity is not yours to remove.");
  if (!isWritableDay(activity.activityDate, state.today)) return fail(WINDOW_ERROR);
  // Removing an activity never deletes the people met in it.
  return done(
    { ...state, activities: state.activities.filter((item) => item.id !== activityId) },
    `${activityKindLabel(activity.kind)} removed.`,
  );
}

// ─── Declarations ──────────────────────────────────────────────────────────

/** "Nothing to report" for ministry or meetings, only when the category has no activity. */
export function declareNil(
  state: DemoState,
  viewerId: string,
  dateKey: string,
  category: Exclude<ReportCategory, "devotional">,
): Outcome {
  if (!isWritableDay(dateKey, state.today)) return fail(WINDOW_ERROR);
  if (activitiesFor(state, viewerId, dateKey, category).length > 0) {
    return fail("This day already has activity here. Remove it first to report nil.");
  }
  return done(
    withDeclaration(state, viewerId, dateKey, category, "nil"),
    category === "meetings" ? "Recorded: no meeting." : "Recorded: no ministry activity.",
  );
}

export function clearDeclaration(
  state: DemoState,
  viewerId: string,
  dateKey: string,
  category: ReportCategory,
): Outcome {
  if (!isWritableDay(dateKey, state.today)) return fail(WINDOW_ERROR);
  return done(withDeclaration(state, viewerId, dateKey, category, null), "Change undone.");
}

/** Confirms the compiled devotion for a day; the sources themselves are never copied. */
export function confirmDevotional(state: DemoState, viewerId: string, dateKey: string): Outcome {
  if (!isWritableDay(dateKey, state.today)) return fail(WINDOW_ERROR);
  return done(
    withDeclaration(state, viewerId, dateKey, "devotional", "confirmed"),
    "Devotional report confirmed.",
  );
}

/**
 * The preview stand-in for the canonical sources (Prayer Watch, Bible
 * reading, podcast, SOGP). Editing here is editing the source: the
 * devotional report only ever reads it.
 */
export function updateDevotion(
  state: DemoState,
  viewerId: string,
  dateKey: string,
  activity: DayActivity,
): Outcome {
  if (!isWritableDay(dateKey, state.today)) return fail(WINDOW_ERROR);
  const viewer = findPerson(state, viewerId);
  if (!viewer) return fail("Choose who you are in the demo first.");
  const sogp = viewer.inCohort ? activity.sogp : null;
  const day: DayActivity = {
    bible:
      activity.bible && activity.bible.chapters > 0
        ? { ...activity.bible, chapters: Math.min(150, Math.floor(activity.bible.chapters)) }
        : null,
    prayerWatch: [...new Set(activity.prayerWatch)],
    podcastEpisodes: Math.max(0, Math.min(20, Math.floor(activity.podcastEpisodes))),
    sogp,
  };
  return done(
    {
      ...state,
      devotion: {
        ...state.devotion,
        [viewerId]: { ...(state.devotion[viewerId] ?? {}), [dateKey]: day },
      },
    },
    "Saved at the source.",
  );
}

// ─── Reminders (queued in the demo only) ──────────────────────────────────

export function queueReminder(
  state: DemoState,
  viewerId: string,
  subjectId: string,
  dateKey: string,
): Outcome {
  if (!oversees(state, viewerId, subjectId)) {
    return fail("You can only remind people in your scope.");
  }
  if (dayReport(state, subjectId, dateKey).overall === "complete") {
    return fail("Their report for this day is already complete.");
  }
  const duplicate = state.reminders.some(
    (reminder) =>
      reminder.byId === viewerId && reminder.subjectId === subjectId && reminder.dateKey === dateKey,
  );
  if (duplicate) return fail("A reminder is already queued for this day.");
  const subject = findPerson(state, subjectId)!;
  return done(
    {
      ...state,
      nextId: state.nextId + 1,
      reminders: [
        ...state.reminders,
        {
          id: state.nextId,
          byId: viewerId,
          subjectId,
          dateKey,
          queuedAt: new Date().toISOString(),
        },
      ],
    },
    `Reminder for ${subject.firstName} queued in this demo. Nothing was sent.`,
  );
}

export function cancelReminder(state: DemoState, viewerId: string, reminderId: number): Outcome {
  const reminder = state.reminders.find((item) => item.id === reminderId);
  if (!reminder || reminder.byId !== viewerId) return fail("That reminder is not yours.");
  return done(
    { ...state, reminders: state.reminders.filter((item) => item.id !== reminderId) },
    "Reminder removed from the queue.",
  );
}

// ─── Discipleship groups ───────────────────────────────────────────────────

export function validateGroupName(
  value: string,
  otherNames: string[],
): { ok: true; name: string } | { ok: false; error: string } {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < DEMO_GROUP_NAME_MIN) {
    return { ok: false, error: `Give the group a name of at least ${DEMO_GROUP_NAME_MIN} characters.` };
  }
  if (name.length > DEMO_GROUP_NAME_MAX) {
    return { ok: false, error: `Keep the group name under ${DEMO_GROUP_NAME_MAX} characters.` };
  }
  if (otherNames.some((other) => other.trim().toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "You already have a group with this name." };
  }
  return { ok: true, name };
}

export function createGroupBlock(state: DemoState, leaderId: string): string | null {
  const open = openLedGroups(state, leaderId);
  if (open.some((group) => group.status === "archived")) {
    return "One of your groups has been paused by the Pleros team. Contact support before changing your groups.";
  }
  if (open.length >= DEMO_GROUPS_LED_MAX) {
    return `You can lead up to ${DEMO_GROUPS_LED_MAX} groups. Close one you no longer need to start another.`;
  }
  return null;
}

export function createGroup(state: DemoState, viewerId: string, rawName: string): Outcome & { groupId?: number } {
  if (!findPerson(state, viewerId)) return fail("Choose who you are in the demo first.");
  const block = createGroupBlock(state, viewerId);
  if (block) return fail(block);
  const name = validateGroupName(
    rawName,
    openLedGroups(state, viewerId).map((group) => group.name),
  );
  if (!name.ok) return fail(name.error);
  const id = state.nextId;
  const inviteCode = Math.floor(seeded(`${viewerId}:${id}:${name.name}`) * 0xffffffff)
    .toString(16)
    .padStart(8, "0");
  return {
    ...done(
      {
        ...state,
        nextId: id + 1,
        groups: [
          ...state.groups,
          { id, leaderId: viewerId, name: name.name, status: "active", inviteCode, createdOn: state.today },
        ],
      },
      `${name.name} created.`,
    ),
    groupId: id,
  };
}

export function renameGroup(state: DemoState, viewerId: string, groupId: number, rawName: string): Outcome {
  const group = state.groups.find((item) => item.id === groupId);
  if (!group || group.leaderId !== viewerId) return fail("You can only rename a group you lead.");
  if (group.status !== "active") return fail("Only an active group can be renamed.");
  const name = validateGroupName(
    rawName,
    openLedGroups(state, viewerId)
      .filter((item) => item.id !== groupId)
      .map((item) => item.name),
  );
  if (!name.ok) return fail(name.error);
  return done(
    {
      ...state,
      groups: state.groups.map((item) => (item.id === groupId ? { ...item, name: name.name } : item)),
    },
    "Group renamed.",
  );
}

/** Ends a group for good: the link stops working and its disciples are released, nothing is deleted. */
export function closeGroup(state: DemoState, viewerId: string, groupId: number): Outcome {
  const group = state.groups.find((item) => item.id === groupId);
  if (!group || group.leaderId !== viewerId) return fail("You can only close a group you lead.");
  if (group.status !== "active") {
    return fail("A paused group can't be closed by its leader.");
  }
  if (openLedGroups(state, viewerId).length <= 1) {
    return fail("You need at least one group, so this one can't be closed.");
  }
  return done(
    {
      ...state,
      groups: state.groups.map((item) => (item.id === groupId ? { ...item, status: "closed" } : item)),
      memberships: state.memberships.map((membership) =>
        membership.groupId === groupId && membership.status === "active"
          ? { ...membership, status: "left" }
          : membership,
      ),
    },
    `${group.name} closed.`,
  );
}

// ─── Contact → invitation → explicit acceptance ───────────────────────────

/** Logs a follow-up with someone the member met. It never adds them to a group. */
export function logFollowUp(state: DemoState, viewerId: string, contactId: number): Outcome {
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact || contact.ownerId !== viewerId) return fail("You can only follow up people you met.");
  return done(
    {
      ...state,
      contacts: state.contacts.map((item) =>
        item.id === contactId
          ? {
              ...item,
              followedUpAt: `${state.today}T12:00:00.000Z`,
              discipleshipStatus:
                item.discipleshipStatus === "not_started" ? "following_up" : item.discipleshipStatus,
            }
          : item,
      ),
    },
    `Follow-up with ${contact.name} logged.`,
  );
}

/** Shares one of the member's group links with a contact. Membership waits for their acceptance. */
export function inviteContact(
  state: DemoState,
  viewerId: string,
  contactId: number,
  groupId: number,
): Outcome {
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact || contact.ownerId !== viewerId) return fail("You can only invite people you met.");
  if (contact.personId && joinedGroup(state, contact.personId)) {
    return fail(`${contact.name} is already in a discipleship group.`);
  }
  const group = ledGroups(state, viewerId).find((item) => item.id === groupId);
  if (!group) return fail("Choose one of your own groups.");
  if (group.status !== "active") return fail("Only an active group can take new people.");
  return done(
    {
      ...state,
      contacts: state.contacts.map((item) =>
        item.id === contactId
          ? { ...item, invite: { groupId, status: "invited", invitedOn: state.today } }
          : item,
      ),
    },
    `${group.name}'s link is ready to share with ${contact.name}. They join only when they accept.`,
  );
}

/**
 * The contact's own explicit step: they enrol and accept on the invite page.
 * In the demo the presenter plays the contact; it is the only path into a group.
 */
export function acceptInvite(state: DemoState, contactId: number): Outcome {
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact?.invite || contact.invite.status !== "invited") return fail("There is no open invitation.");
  const group = state.groups.find((item) => item.id === contact.invite!.groupId);
  if (!group || group.status !== "active") return fail("This discipleship group is no longer active.");
  if (groupMemberIds(state, group.id).length >= DEMO_GROUP_MAX) {
    return fail(`This group is full. Groups have up to ${DEMO_GROUP_MAX} people.`);
  }
  if (contact.personId && joinedGroup(state, contact.personId)) {
    return fail("They are already in a discipleship group.");
  }

  let people = state.people;
  let personId = contact.personId;
  if (!personId) {
    personId = `c-${contact.id}`;
    const firstName = contact.name.split(" ")[0] ?? contact.name;
    people = [
      ...people,
      {
        id: personId,
        name: contact.name,
        firstName,
        tier: "disciple",
        supervisorId: null,
        orgUnit: null,
        locationGroup: findPerson(state, contact.ownerId)?.locationGroup ?? "Lagos",
        inCohort: true,
        fromContactId: contact.id,
      },
    ];
  }

  return done(
    {
      ...state,
      people,
      memberships: [
        ...state.memberships,
        { groupId: group.id, personId, status: "active", joinedOn: state.today },
      ],
      contacts: state.contacts.map((item) =>
        item.id === contactId
          ? {
              ...item,
              personId,
              discipleshipStatus: "in_discipleship",
              invite: { ...item.invite!, status: "accepted" },
            }
          : item,
      ),
    },
    `${contact.name} accepted and joined ${group.name}.`,
  );
}

export function declineInvite(state: DemoState, contactId: number): Outcome {
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact?.invite || contact.invite.status !== "invited") return fail("There is no open invitation.");
  return done(
    {
      ...state,
      contacts: state.contacts.map((item) =>
        item.id === contactId ? { ...item, invite: { ...item.invite!, status: "declined" } } : item,
      ),
    },
    `${contact.name} declined. Nothing changed in your group.`,
  );
}

/** Edits only the active synthetic person's display profile, never credentials or roles. */
export function saveDemoProfile(state: DemoState, personId: string, input: { name: string; photoDataUrl?: string }): Outcome {
  if (!findPerson(state, personId)) return fail("Profile unavailable.");
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name || name.length > 80 || /[\u0000-\u001f]/.test(name)) return fail("Enter a name of up to 80 characters.");
  const photo = input.photoDataUrl;
  if (photo && (photo.length > 160_000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(photo))) return fail("Choose a supported photo.");
  return done({ ...state, people: state.people.map((person) => person.id === personId ? {
    ...person, name, firstName: name.replace(/^Pastor\s+/i, "").split(" ")[0], photoDataUrl: photo,
  } : person) }, "Profile saved.");
}
