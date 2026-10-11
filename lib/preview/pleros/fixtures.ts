import type { ActivityKind, OutreachMode } from "@/lib/community/ministry-activities";
import {
  emptyMinistryNumbers,
  type DayActivity,
  type MinistryNumbers,
} from "@/lib/community/ministry-report";
import { shiftDate } from "@/lib/sogp/daily-date";

import type {
  DemoActivity,
  DemoContact,
  DemoGroup,
  DemoMembership,
  DemoPerson,
  DemoState,
  MeetingRole,
  ReportCategory,
  CategoryDeclaration,
} from "./types";

/**
 * Deterministic synthetic fixtures for `/preview/pleros`, built relative to
 * the Lagos day so the demo always opens on "today". Every name is invented;
 * none comes from a call recording or the live database.
 */

export const DEMO_STATE_VERSION = 2 as const;

/** Mirrors the live rules in `lib/sogp/discipleship.ts` (pinned by a test, not imported: that module uses node:crypto). */
export const DEMO_GROUPS_LED_MAX = 5;
export const DEMO_GROUP_MAX = 12;
export const DEMO_GROUP_NAME_MIN = 3;
export const DEMO_GROUP_NAME_MAX = 60;

/** The person the demo opens as: a worker with an unreported day. */
export const DEFAULT_PERSON_ID = "w-tolu";

const PEOPLE: DemoPerson[] = [
  person("p-ife", "Pastor Ife Adewale", "Ife", "pastor", null, "Pleros ministry", "Lagos", false),
  person("p-kunle", "Kunle Bamidele", "Kunle", "pastorate", "p-ife", "Mainland branch", "Lagos", false),
  person("p-ngozi", "Ngozi Eze", "Ngozi", "pastorate", "p-ife", "Capital branch", "FCT Abuja", true),
  person("u-chioma", "Chioma Obi", "Chioma", "unit_leader", "p-kunle", "Yaba unit", "Lagos", true),
  person("u-femi", "Femi Lawal", "Femi", "unit_leader", "p-kunle", "Ikeja unit", "Lagos", true),
  person("u-amina", "Amina Bello", "Amina", "unit_leader", "p-ngozi", "Wuse unit", "FCT Abuja", true),
  person("w-tolu", "Tolu Akande", "Tolu", "worker", "u-chioma", "Yaba unit", "Lagos", true),
  person("w-sade", "Sade Martins", "Sade", "worker", "u-chioma", "Yaba unit", "Lagos", true),
  person("w-emeka", "Emeka Nwosu", "Emeka", "worker", "u-chioma", "Yaba unit", "Lagos", true),
  person("w-bisi", "Bisi Ojo", "Bisi", "worker", "u-femi", "Ikeja unit", "Lagos", true),
  person("w-dayo", "Dayo Peters", "Dayo", "worker", "u-femi", "Ikeja unit", "Ogun", true),
  person("w-halima", "Halima Sani", "Halima", "worker", "u-amina", "Wuse unit", "FCT Abuja", true),
  person("w-joseph", "Joseph Udo", "Joseph", "worker", "u-amina", "Wuse unit", "FCT Abuja", true),
  person("d-grace", "Grace Adebayo", "Grace", "disciple", null, null, "Lagos", true),
  person("d-samuel", "Samuel Okoro", "Samuel", "disciple", null, null, "Lagos", true),
  person("d-blessing", "Blessing Ike", "Blessing", "disciple", null, null, "Lagos", true),
  person("d-musa", "Musa Garba", "Musa", "disciple", null, null, "FCT Abuja", true),
  person("d-ruth", "Ruth Alabi", "Ruth", "disciple", null, null, "Lagos", true),
  person("d-kemi", "Kemi Johnson", "Kemi", "disciple", null, null, "Oyo", true),
];

function person(
  id: string,
  name: string,
  firstName: string,
  tier: DemoPerson["tier"],
  supervisorId: string | null,
  orgUnit: string | null,
  locationGroup: string,
  inCohort: boolean,
): DemoPerson {
  return { id, name, firstName, tier, supervisorId, orgUnit, locationGroup, inCohort };
}

/** Each leadership tier leads its own named groups; some people are both overseen and discipled. */
const GROUPS: Array<Omit<DemoGroup, "createdOn"> & { members: string[]; ageDays: number }> = [
  { id: 1, leaderId: "p-ife", name: "Thursday leaders' circle", status: "active", inviteCode: "a1f0c3d9", members: ["d-ruth", "p-ngozi"], ageDays: 40 },
  { id: 2, leaderId: "p-kunle", name: "Mainland disciples", status: "active", inviteCode: "b27e4a10", members: ["d-kemi", "w-bisi"], ageDays: 34 },
  { id: 3, leaderId: "p-kunle", name: "Campus fellowship", status: "active", inviteCode: "c3d19b77", members: [], ageDays: 6 },
  { id: 4, leaderId: "p-ngozi", name: "Garki Bible circle", status: "archived", inviteCode: "d4a8e215", members: [], ageDays: 28 },
  { id: 5, leaderId: "u-chioma", name: "Yaba Tuesday group", status: "active", inviteCode: "e5b67f02", members: ["d-blessing", "w-sade"], ageDays: 30 },
  { id: 6, leaderId: "u-chioma", name: "Old Saturday group", status: "closed", inviteCode: "f6c02d48", members: [], ageDays: 60 },
  { id: 7, leaderId: "u-femi", name: "Ikeja men's group", status: "active", inviteCode: "07d93e5a", members: ["w-dayo"], ageDays: 21 },
  { id: 8, leaderId: "u-amina", name: "Wuse home group", status: "active", inviteCode: "18e4a6bc", members: ["d-musa", "w-halima"], ageDays: 25 },
  { id: 9, leaderId: "w-tolu", name: "Tolu's discipleship group", status: "active", inviteCode: "ab12cd34", members: ["d-grace", "d-samuel"], ageDays: 26 },
  { id: 10, leaderId: "w-tolu", name: "Office lunch group", status: "active", inviteCode: "9c4e7f21", members: [], ageDays: 3 },
];

/** A stable number in [0, 1) for a seed string, so fixtures never shift between renders. */
export function seeded(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10_000) / 10_000;
}

/** The Monday of a date key's week. */
export function mondayOf(dateKey: string): string {
  const weekday = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return shiftDate(dateKey, -((weekday + 6) % 7));
}

/** The demo cohort started on the Monday two weeks before this week, so today sits in Level 3. */
export function cohortStartFor(today: string): string {
  return shiftDate(mondayOf(today), -14);
}

export function isSunday(dateKey: string): boolean {
  return new Date(`${dateKey}T00:00:00.000Z`).getUTCDay() === 0;
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round(
    (Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / 86_400_000,
  );
}

function devotionDay(member: DemoPerson, dateKey: string, cohortStart: string, today: string): DayActivity {
  const seed = `${member.id}:${dateKey}`;
  const dayIndex = daysBetween(cohortStart, dateKey);
  const isToday = dateKey === today;
  const bibleChance = seeded(`${seed}:bible`);
  const prayer = seeded(`${seed}:prayer`);
  const sunday = isSunday(dateKey);
  const listened = seeded(`${seed}:listen`) < (isToday ? 0.35 : 0.8);

  return {
    bible:
      bibleChance < (isToday ? 0.4 : 0.65)
        ? {
            chapters: 1 + Math.floor(seeded(`${seed}:chapters`) * 3),
            book: "John",
            chapter: Math.min(21, 1 + Math.max(0, dayIndex)),
          }
        : null,
    prayerWatch:
      prayer < (isToday ? 0.5 : 0.75)
        ? prayer < 0.2
          ? ["morning", "evening"]
          : ["morning"]
        : [],
    podcastEpisodes: seeded(`${seed}:podcast`) < 0.35 ? 1 : 0,
    sogp:
      member.inCohort && dayIndex >= 0
        ? {
            listened: sunday ? null : listened,
            quizAttempted: !sunday && listened && seeded(`${seed}:quiz`) < 0.85,
            writtenSubmitted: !sunday && listened && seeded(`${seed}:written`) < 0.5,
            reviewAttended: sunday && seeded(`${seed}:review`) < 0.7,
            preparationDone: false,
          }
        : null,
  };
}

/** Worker A's today is scripted: prayer and Bible already recorded, teaching not yet. */
function scriptedToday(member: DemoPerson): DayActivity | null {
  if (member.id !== DEFAULT_PERSON_ID) return null;
  return {
    bible: { chapters: 2, book: "John", chapter: 6 },
    prayerWatch: ["morning"],
    podcastEpisodes: 0,
    sogp: {
      listened: false,
      quizAttempted: false,
      writtenSubmitted: false,
      reviewAttended: false,
      preparationDone: false,
    },
  };
}

type DayPlan = "complete" | "in_progress" | "not_started";

/** Today's reporting state per person, so every supervisor opens on a mixed picture. */
const TODAY_PLAN: Record<string, DayPlan> = {
  "p-ife": "in_progress",
  "p-kunle": "complete",
  "p-ngozi": "in_progress",
  "u-chioma": "in_progress",
  "u-femi": "complete",
  "u-amina": "not_started",
  "w-tolu": "not_started",
  "w-sade": "complete",
  "w-emeka": "not_started",
  "w-bisi": "in_progress",
  "w-dayo": "complete",
  "w-halima": "in_progress",
  "w-joseph": "not_started",
};

const PLACES = ["Yaba market", "Sabo bus stop", "Unilag gate", "Ikeja City Mall", "Wuse market"];
const PLATFORMS = ["whatsapp", "facebook", "instagram", "tiktok"];
const MEETING_NAMES = ["Tuesday Bible study", "Unit prayer hour", "Home cell", "Midweek prayer"];

function numbers(patch: Partial<MinistryNumbers>): MinistryNumbers {
  return { ...emptyMinistryNumbers(), ...patch };
}

export function buildDemoState(today: string): DemoState {
  const cohortStart = cohortStartFor(today);
  const people = PEOPLE.map((member) => ({ ...member }));
  const devotion: DemoState["devotion"] = {};
  const declarations: DemoState["declarations"] = {};
  const activities: DemoActivity[] = [];
  let nextId = 1000;

  const historyStart = shiftDate(today, -20);
  for (const member of people) {
    devotion[member.id] = {};
    for (let offset = 0; daysBetween(historyStart, today) >= offset; offset += 1) {
      const dateKey = shiftDate(historyStart, offset);
      devotion[member.id][dateKey] =
        dateKey === today && scriptedToday(member)
          ? scriptedToday(member)!
          : devotionDay(member, dateKey, cohortStart, today);
    }
  }

  const declare = (
    personId: string,
    dateKey: string,
    category: ReportCategory,
    value: CategoryDeclaration,
  ) => {
    declarations[personId] ??= {};
    declarations[personId][dateKey] ??= {};
    declarations[personId][dateKey][category] = value;
  };

  const addActivity = (
    personId: string,
    dateKey: string,
    kind: ActivityKind,
    patch: Partial<DemoActivity>,
  ) => {
    activities.push({
      ...numbers({}),
      id: nextId++,
      personId,
      activityDate: dateKey,
      kind,
      title: null,
      mode: null,
      platform: null,
      location: null,
      note: null,
      meetingRole: null,
      taught: null,
      contactIds: [],
      followUpPeople: [],
      createdAt: `${dateKey}T11:00:00.000Z`,
      ...patch,
    });
  };

  const fillMinistry = (personId: string, dateKey: string) => {
    const seed = `${personId}:${dateKey}:ministry`;
    const roll = seeded(seed);
    if (roll < 0.45) {
      const mode: OutreachMode = seeded(`${seed}:mode`) < 0.5 ? "offline" : "online";
      const reached = 4 + Math.floor(seeded(`${seed}:reach`) * 30);
      addActivity(personId, dateKey, "outreach", {
        mode,
        platform: mode === "online" ? PLATFORMS[Math.floor(seeded(`${seed}:p`) * PLATFORMS.length)]! : null,
        location: mode === "offline" ? PLACES[Math.floor(seeded(`${seed}:l`) * PLACES.length)]! : null,
        ...(mode === "online" ? { reachedOnline: reached } : { reachedOffline: reached }),
        saved: Math.floor(seeded(`${seed}:saved`) * 3),
        followUps: Math.floor(seeded(`${seed}:fu`) * 3),
      });
    } else if (roll < 0.75) {
      addActivity(personId, dateKey, "follow_up", {
        followUps: 1 + Math.floor(seeded(`${seed}:count`) * 4),
      });
    } else {
      declare(personId, dateKey, "ministry", "nil");
    }
  };

  const fillMeetings = (personId: string, dateKey: string) => {
    const seed = `${personId}:${dateKey}:meetings`;
    if (seeded(seed) < 0.4) {
      const roles: MeetingRole[] = ["leader", "worker", "member"];
      addActivity(personId, dateKey, seeded(`${seed}:k`) < 0.5 ? "prayer_meeting" : "teaching_meeting", {
        title: MEETING_NAMES[Math.floor(seeded(`${seed}:n`) * MEETING_NAMES.length)]!,
        meetingRole: roles[Math.floor(seeded(`${seed}:r`) * roles.length)]!,
        attendance: 3 + Math.floor(seeded(`${seed}:a`) * 25),
      });
    } else {
      declare(personId, dateKey, "meetings", "nil");
    }
  };

  for (const member of people) {
    if (member.tier === "disciple") continue;
    for (let offset = -6; offset <= 0; offset += 1) {
      const dateKey = shiftDate(today, offset);
      const roll = seeded(`${member.id}:${dateKey}:plan`);
      const plan: DayPlan =
        offset === 0
          ? (TODAY_PLAN[member.id] ?? "not_started")
          : roll < 0.6
            ? "complete"
            : roll < 0.85
              ? "in_progress"
              : "not_started";
      if (plan === "not_started") continue;
      declare(member.id, dateKey, "devotional", "confirmed");
      fillMinistry(member.id, dateKey);
      if (plan === "complete") fillMeetings(member.id, dateKey);
    }
  }

  const contacts: DemoContact[] = [
    contact(501, "w-tolu", "Peace Umeh", shiftDate(today, -5), "saved", "following_up", "Met at Yaba market; asked about the Bible study."),
    contact(502, "w-tolu", "Ifeanyi Obi", shiftDate(today, -4), "not_saved", "not_started", null),
    contact(503, "w-tolu", "Mary Ekpo", shiftDate(today, -2), "believer", "following_up", "Wants to join a small group."),
    contact(504, "u-chioma", "Seun Adio", shiftDate(today, -3), "saved", "following_up", "Prayed together after the outreach."),
    contact(505, "u-femi", "Uche Nnaji", shiftDate(today, -6), "unknown", "not_started", null),
  ];
  // Tolu met two of them at an evangelism activity a few days ago.
  const metActivity = activities.find(
    (activity) => activity.personId === "w-tolu" && activity.kind === "outreach",
  );
  if (metActivity) metActivity.contactIds = [501, 502];

  const groups: DemoGroup[] = GROUPS.map((group) => ({
    id: group.id,
    leaderId: group.leaderId,
    name: group.name,
    status: group.status,
    inviteCode: group.inviteCode,
    createdOn: shiftDate(today, -group.ageDays),
  }));
  const memberships: DemoMembership[] = GROUPS.flatMap((group) =>
    group.members.map((personId, index) => ({
      groupId: group.id,
      personId,
      status: "active" as const,
      joinedOn: shiftDate(today, -(group.ageDays - 2 - index)),
    })),
  );

  return {
    version: DEMO_STATE_VERSION,
    today,
    people,
    activities,
    devotion,
    declarations,
    contacts,
    groups,
    memberships,
    reminders: [],
    nextId,
  };
}

function contact(
  id: number,
  ownerId: string,
  name: string,
  metDate: string,
  salvationStatus: DemoContact["salvationStatus"],
  discipleshipStatus: DemoContact["discipleshipStatus"],
  note: string | null,
): DemoContact {
  return {
    id,
    ownerId,
    name,
    phone: null,
    note,
    metDate,
    salvationStatus,
    discipleshipStatus,
    outcomes: { saved: salvationStatus === "saved", filled: false, healed: false },
    followedUpAt: discipleshipStatus === "following_up" ? `${metDate}T18:00:00.000Z` : null,
    invite: null,
    personId: null,
  };
}
