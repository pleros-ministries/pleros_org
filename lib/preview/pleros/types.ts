import type { ActivityKind, OutreachMode } from "@/lib/community/ministry-activities";
import type { DayActivity, MinistryNumbers } from "@/lib/community/ministry-report";
import type {
  ContactOutcomes,
  DiscipleshipStatus,
  LoggableInteractionKind,
  SalvationStatus,
} from "@/lib/community/outreach-contacts";

/**
 * The synthetic world behind `/preview/pleros`. Nothing here is a schema or an
 * auth role: organisational tiers are presentation labels for the demo, and
 * the whole state lives in one browser tab.
 */

/** Presentation tiers. The legacy fixture key `pastorate` displays as the approved Branch Pastor; it is not a production auth role. */
export type OrgTier = "pastor" | "pastorate" | "unit_leader" | "worker" | "disciple";

export type DemoPerson = {
  id: string;
  name: string;
  firstName: string;
  /** Small inline photo kept only in synthetic tab state. */
  photoDataUrl?: string;
  tier: OrgTier;
  /** The person this one reports to in the organisation, or null. */
  supervisorId: string | null;
  /** Organisational unit or branch this person sits in or leads; never a location group. */
  orgUnit: string | null;
  /** The automatic geographic community group. Shown apart from the organisation. */
  locationGroup: string;
  /** In the running SOGP cohort. */
  inCohort: boolean;
  /** Created when an invited contact enrolled and accepted. */
  fromContactId?: number;
};

/** The three primary report categories. */
export type ReportCategory = "devotional" | "ministry" | "meetings";

/** What a person said about one category on one day, beyond its activities. */
export type CategoryDeclaration = "nil" | "confirmed";

export type CategoryStatus = "activity" | "nil" | "missing";

export type OverallStatus = "complete" | "in_progress" | "not_started";

/** Report context for a meeting. Separate from any app or organisational role. */
export type MeetingRole = "leader" | "worker" | "member";

export type DemoActivity = MinistryNumbers & {
  id: number;
  personId: string;
  activityDate: string;
  kind: ActivityKind;
  title: string | null;
  mode: OutreachMode | null;
  platform: string | null;
  location: string | null;
  note: string | null;
  /** Meetings only: the reporting role and the preview-only "what was taught". */
  meetingRole: MeetingRole | null;
  taught: string | null;
  /** Contacts met at an evangelism activity (ids into `contacts`). */
  contactIds: number[];
  /** Contacts followed up in a discipleship activity (the `followUps` count is a number field). */
  followUpPeople: Array<{
    contactId: number;
    kind: LoggableInteractionKind;
    outcomes: ContactOutcomes;
    note: string | null;
  }>;
  createdAt: string;
};

/** Someone a member met in ministry. Visible to their owner only in this demo. */
export type DemoContact = {
  id: number;
  ownerId: string;
  name: string;
  /** Synthetic and never dialled. */
  phone: string | null;
  note: string | null;
  metDate: string;
  salvationStatus: SalvationStatus;
  discipleshipStatus: DiscipleshipStatus;
  outcomes: ContactOutcomes;
  followedUpAt: string | null;
  /** Invitation to one of the owner's groups; acceptance is a separate explicit step. */
  invite: {
    groupId: number;
    status: "invited" | "accepted" | "declined";
    invitedOn: string;
  } | null;
  /** Set once the contact enrolled and accepted. */
  personId: string | null;
};

export type DemoGroupStatus = "active" | "archived" | "closed";

export type DemoGroup = {
  id: number;
  leaderId: string;
  name: string;
  status: DemoGroupStatus;
  inviteCode: string;
  createdOn: string;
};

export type DemoMembership = {
  groupId: number;
  personId: string;
  status: "active" | "left";
  joinedOn: string;
};

export type DemoReminder = {
  id: number;
  byId: string;
  subjectId: string;
  dateKey: string;
  queuedAt: string;
};

export type DemoState = {
  version: 2;
  today: string;
  people: DemoPerson[];
  activities: DemoActivity[];
  /** Canonical compiled devotion per person per day, as the live sources would record it. */
  devotion: Record<string, Record<string, DayActivity>>;
  declarations: Record<string, Record<string, Partial<Record<ReportCategory, CategoryDeclaration>>>>;
  contacts: DemoContact[];
  groups: DemoGroup[];
  memberships: DemoMembership[];
  reminders: DemoReminder[];
  nextId: number;
};

export type Outcome =
  | { ok: true; state: DemoState; message?: string }
  | { ok: false; error: string };
