import { describe, expect, it } from "vitest";

import { emptyDraft, withKind, type ActivityDraft } from "@/lib/community/activity-form";
import {
  DISCIPLESHIP_GROUP_MAX,
  DISCIPLESHIP_GROUP_NAME_MAX,
  DISCIPLESHIP_GROUP_NAME_MIN,
  DISCIPLESHIP_GROUPS_LED_MAX,
} from "@/lib/sogp/discipleship";

import { dayReport } from "./daily-report";
import {
  DEMO_GROUP_MAX,
  DEMO_GROUP_NAME_MAX,
  DEMO_GROUP_NAME_MIN,
  DEMO_GROUPS_LED_MAX,
  buildDemoState,
} from "./fixtures";
import { groupMemberIds, joinedGroup } from "./scope";
import {
  acceptInvite,
  closeGroup,
  createGroup,
  declineInvite,
  inviteContact,
  logFollowUp,
  queueReminder,
  renameGroup,
  saveActivity,
  saveDemoProfile,
} from "./store";
import type { DemoState, Outcome } from "./types";

const TODAY = "2026-10-09";
const WORKER = "w-tolu";

function ok(outcome: Outcome): DemoState {
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.state;
}

function draftFor(kind: ActivityDraft["kind"] & string, patch: Partial<ActivityDraft> = {}): ActivityDraft {
  return { ...withKind(emptyDraft(TODAY), kind), ...patch };
}

describe("fixtures", () => {
  it("are deterministic for a day", () => {
    expect(buildDemoState(TODAY)).toEqual(buildDemoState(TODAY));
  });

  it("mirror the live discipleship limits", () => {
    expect(DEMO_GROUPS_LED_MAX).toBe(DISCIPLESHIP_GROUPS_LED_MAX);
    expect(DEMO_GROUP_MAX).toBe(DISCIPLESHIP_GROUP_MAX);
    expect(DEMO_GROUP_NAME_MIN).toBe(DISCIPLESHIP_GROUP_NAME_MIN);
    expect(DEMO_GROUP_NAME_MAX).toBe(DISCIPLESHIP_GROUP_NAME_MAX);
  });

  it("keep each person in at most one group and never in their own", () => {
    const state = buildDemoState(TODAY);
    const active = state.memberships.filter((membership) => membership.status === "active");
    expect(new Set(active.map((membership) => membership.personId)).size).toBe(active.length);
    for (const membership of active) {
      const group = state.groups.find((item) => item.id === membership.groupId)!;
      expect(group.leaderId).not.toBe(membership.personId);
    }
  });
});

describe("saving activities", () => {
  it("uses the live validation for evangelism", () => {
    const state = buildDemoState(TODAY);
    const noMode = saveActivity(state, { viewerId: WORKER, draft: draftFor("outreach") });
    expect(noMode).toEqual({ ok: false, error: "Choose online, offline or both." });

    const base = draftFor("outreach", { mode: "online", platform: "whatsapp" });
    const decimal = saveActivity(state, {
      viewerId: WORKER,
      draft: { ...base, numbers: { ...base.numbers, reachedOnline: "2.5" } },
    });
    expect(decimal.ok).toBe(false);
    const negative = saveActivity(state, {
      viewerId: WORKER,
      draft: { ...base, numbers: { ...base.numbers, reachedOnline: "-3" } },
    });
    expect(negative.ok).toBe(false);
  });

  it("records anonymous online reach without names", () => {
    const base = draftFor("outreach", { mode: "online", platform: "tiktok" });
    const state = ok(
      saveActivity(buildDemoState(TODAY), {
        viewerId: WORKER,
        draft: { ...base, numbers: { ...base.numbers, reachedOnline: "250" } },
      }),
    );
    const saved = state.activities.at(-1)!;
    expect(saved.reachedOnline).toBe(250);
    expect(saved.contactIds).toEqual([]);
  });

  it("turns named people met into the worker's own contacts", () => {
    const base = draftFor("outreach", { mode: "offline", location: "Sabo" });
    const state = ok(
      saveActivity(buildDemoState(TODAY), {
        viewerId: WORKER,
        draft: {
          ...base,
          numbers: { ...base.numbers, reachedOffline: "6", saved: "1" },
          people: [
            {
              key: "a",
              id: null,
              name: "Ada Lovette",
              phone: "",
              note: "",
              saved: true,
              filled: false,
              healed: false,
              wantsFollowUp: true,
            },
          ],
        },
      }),
    );
    const created = state.contacts.find((contact) => contact.name === "Ada Lovette")!;
    expect(created.ownerId).toBe(WORKER);
    expect(created.salvationStatus).toBe("saved");
    expect(created.discipleshipStatus).toBe("following_up");
  });

  it("asks a meeting for the reporting role and keeps 'what was taught' for leaders only", () => {
    const base = draftFor("teaching_meeting");
    const draft = { ...base, numbers: { ...base.numbers, attendance: "18" } };
    const state = buildDemoState(TODAY);
    expect(saveActivity(state, { viewerId: WORKER, draft }).ok).toBe(false);

    const leader = ok(
      saveActivity(state, { viewerId: WORKER, draft, meetingRole: "leader", taught: "John 6" }),
    );
    expect(leader.activities.at(-1)).toMatchObject({ meetingRole: "leader", taught: "John 6", attendance: 18 });

    const worker = ok(
      saveActivity(state, { viewerId: WORKER, draft, meetingRole: "worker", taught: "ignored" }),
    );
    expect(worker.activities.at(-1)).toMatchObject({ meetingRole: "worker", taught: null });
  });

  it("refuses to edit someone else's activity", () => {
    const state = buildDemoState(TODAY);
    const theirs = state.activities.find((activity) => activity.personId === "w-sade" && activity.activityDate === TODAY)!;
    const draft = draftFor(theirs.kind);
    expect(saveActivity(state, { viewerId: WORKER, draft, activityId: theirs.id }).ok).toBe(false);
  });
});

describe("reminders", () => {
  it("queue only inside the viewer's scope, for incomplete days, once, and never send", () => {
    const state = buildDemoState(TODAY);
    expect(dayReport(state, "w-emeka", TODAY).overall).not.toBe("complete");
    const queued = ok(queueReminder(state, "u-chioma", "w-emeka", TODAY));
    expect(queued.reminders).toHaveLength(1);
    expect(Object.keys(queued.reminders[0]!).sort()).toEqual(["byId", "dateKey", "id", "queuedAt", "subjectId"]);

    expect(queueReminder(queued, "u-chioma", "w-emeka", TODAY).ok).toBe(false);
    expect(queueReminder(state, "u-chioma", "w-bisi", TODAY).ok).toBe(false);
    expect(queueReminder(state, "w-tolu", "w-emeka", TODAY).ok).toBe(false);
    expect(dayReport(state, "w-sade", TODAY).overall).toBe("complete");
    expect(queueReminder(state, "u-chioma", "w-sade", TODAY).ok).toBe(false);
  });
});

describe("discipleship groups", () => {
  it("respects the five-group limit and the paused-group block", () => {
    let state = buildDemoState(TODAY);
    for (const name of ["Group three", "Group four", "Group five"]) {
      state = ok(createGroup(state, WORKER, name));
    }
    expect(createGroup(state, WORKER, "Group six")).toMatchObject({ ok: false });
    expect(createGroup(buildDemoState(TODAY), "p-ngozi", "Another")).toMatchObject({ ok: false });
    expect(createGroup(buildDemoState(TODAY), WORKER, "Tolu's discipleship group")).toMatchObject({ ok: false });
  });

  it("creates a first group lazily for someone who leads none", () => {
    const state = ok(createGroup(buildDemoState(TODAY), "d-grace", "Grace's group"));
    expect(state.groups.filter((group) => group.leaderId === "d-grace")).toHaveLength(1);
  });

  it("never closes the last open group or a paused one, and releases members when closing", () => {
    const state = buildDemoState(TODAY);
    expect(closeGroup(state, "u-femi", 7).ok).toBe(false);
    expect(closeGroup(state, "p-ngozi", 4).ok).toBe(false);
    expect(closeGroup(state, "p-ife", 1).ok).toBe(false);
    const withSecond = ok(createGroup(state, "p-ife", "Second circle"));
    const after = ok(closeGroup(withSecond, "p-ife", 1));
    expect(after.groups.find((group) => group.id === 1)!.status).toBe("closed");
    expect(groupMemberIds(after, 1)).toEqual([]);
    expect(after.people.length).toBe(state.people.length);
    expect(renameGroup(after, "p-ife", 1, "Reopened").ok).toBe(false);
  });

  it("joins a contact only through explicit acceptance", () => {
    let state = buildDemoState(TODAY);
    const contactId = 503;
    const memberships = state.memberships.length;

    state = ok(logFollowUp(state, WORKER, contactId));
    const followUp = draftFor("follow_up", {
      followUps: [
        { contactId, name: "Mary Ekpo", phone: null, kind: "call", saved: false, filled: false, healed: false, note: "" },
      ],
    });
    state = ok(saveActivity(state, { viewerId: WORKER, draft: followUp }));
    state = ok(inviteContact(state, WORKER, contactId, 10));
    expect(state.memberships.length).toBe(memberships);
    expect(groupMemberIds(state, 10)).toEqual([]);

    expect(inviteContact(state, "u-chioma", contactId, 5).ok).toBe(false);

    state = ok(acceptInvite(state, contactId));
    const contact = state.contacts.find((item) => item.id === contactId)!;
    expect(contact.invite?.status).toBe("accepted");
    expect(joinedGroup(state, contact.personId!)?.id).toBe(10);
    expect(acceptInvite(state, contactId).ok).toBe(false);
    expect(inviteContact(state, WORKER, contactId, 9).ok).toBe(false);
  });

  it("leaves membership alone when an invitation is declined", () => {
    let state = ok(inviteContact(buildDemoState(TODAY), WORKER, 501, 9));
    state = ok(declineInvite(state, 501));
    expect(groupMemberIds(state, 9).sort()).toEqual(["d-grace", "d-samuel"]);
  });

  it("refuses a thirteenth member", () => {
    let state = buildDemoState(TODAY);
    state = {
      ...state,
      memberships: [
        ...state.memberships,
        ...Array.from({ length: 10 }, (_, index) => ({
          groupId: 9,
          personId: `filler-${index}`,
          status: "active" as const,
          joinedOn: TODAY,
        })),
      ],
    };
    expect(groupMemberIds(state, 9)).toHaveLength(12);
    state = ok(inviteContact(state, WORKER, 502, 9));
    expect(acceptInvite(state, 502)).toEqual({
      ok: false,
      error: "This group is full. Groups have up to 12 people.",
    });
  });
});

describe("synthetic profile", () => {
  it("changes display details without changing identity, role or another person", () => {
    const before = buildDemoState(TODAY);
    const result = ok(saveDemoProfile(before, WORKER, { name: "Tolu Akin", photoDataUrl: "data:image/jpeg;base64,AA==" }));
    const original = before.people.find((person) => person.id === WORKER)!;
    expect(result.people.find((person) => person.id === WORKER)).toEqual({ ...original, name: "Tolu Akin", firstName: "Tolu", photoDataUrl: "data:image/jpeg;base64,AA==" });
    expect(result.people.filter((person) => person.id !== WORKER)).toEqual(before.people.filter((person) => person.id !== WORKER));
    expect(result.groups).toEqual(before.groups);
  });
  it("refuses absent identities, blank names and external photos", () => {
    const state = buildDemoState(TODAY);
    expect(saveDemoProfile(state, "absent", { name: "Someone" }).ok).toBe(false);
    expect(saveDemoProfile(state, WORKER, { name: " " }).ok).toBe(false);
    expect(saveDemoProfile(state, WORKER, { name: "Tolu", photoDataUrl: "https://example.com/photo.jpg" }).ok).toBe(false);
  });
});
