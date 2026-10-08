import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { StepperHeader } from "../../components/community/report/activity-form/stepper-header";
import { ChoiceGroup, ToggleChip } from "../../components/community/report/choice-chips";
import { ContactStatusBadges } from "../../components/community/report/contact-status-badges";
import { MemberActivityList } from "../../components/community/report/member-activity-list";
import { emptyDraft, withKind } from "./activity-form";
import { emptyMinistryNumbers } from "./ministry-report";

describe("StepperHeader", () => {
  test("counts the steps once a kind is chosen and fills the bar", () => {
    const draft = withKind(emptyDraft("2026-10-05"), "outreach");
    const html = renderToStaticMarkup(
      <StepperHeader
        steps={["kind", "where", "numbers", "people", "review"]}
        index={1}
        draft={draft}
        canJump={false}
        onJump={() => {}}
      />,
    );
    expect(html).toContain("Step 2 of 5");
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain('aria-valuemax="5"');
    expect(html).toContain("width:40%");
  });

  test("shows only Step 1 before a kind is chosen, and jump chips when editing", () => {
    const first = renderToStaticMarkup(
      <StepperHeader
        steps={["kind"]}
        index={0}
        draft={emptyDraft("2026-10-05")}
        canJump
        onJump={() => {}}
      />,
    );
    expect(first).toContain("Step 1<");
    expect(first).not.toContain("of 1");

    const editing = renderToStaticMarkup(
      <StepperHeader
        steps={["kind", "where", "numbers", "review"]}
        index={3}
        draft={withKind(emptyDraft("2026-10-05"), "prayer_meeting")}
        canJump
        onJump={() => {}}
      />,
    );
    expect(editing).toContain('aria-current="step"');
    expect(editing).toContain("Note and review");
    expect(editing).toContain("How many people?");
  });
});

describe("choices", () => {
  test("a choice group keeps real radios in the markup", () => {
    const html = renderToStaticMarkup(
      <ChoiceGroup
        name="mode"
        label="How did you reach people?"
        layout="segmented"
        value="online"
        onChange={() => {}}
        options={[
          { key: "online", label: "Online" },
          { key: "offline", label: "Offline" },
        ]}
        invalid
      />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-invalid="true"');
    const radios = html.match(/<input[^>]*type="radio"[^>]*>/g) ?? [];
    expect(radios).toHaveLength(2);
    // Whatever order the attributes come in, only the chosen option is checked.
    const checked = radios.filter((radio) => radio.includes("checked"));
    expect(checked).toHaveLength(1);
    expect(checked[0]).toContain('value="online"');
    expect(html).toContain("sr-only");
  });

  test("a toggle chip is a checkbox", () => {
    const html = renderToStaticMarkup(
      <ToggleChip label="Saved" checked onChange={() => {}} />,
    );
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("checked");
    expect(html).toContain("Saved");
  });
});

describe("ContactStatusBadges", () => {
  const base = {
    salvationStatus: "unknown" as const,
    discipleshipStatus: "not_started" as const,
    nextFollowUpDate: null,
    followedUpAt: null,
  };

  test("stays quiet when nothing is set", () => {
    expect(renderToStaticMarkup(<ContactStatusBadges contact={base} today="2026-10-05" />)).toBe("");
  });

  test("names each status and when a follow-up is due", () => {
    const html = renderToStaticMarkup(
      <ContactStatusBadges
        contact={{
          salvationStatus: "saved",
          discipleshipStatus: "following_up",
          nextFollowUpDate: "2026-10-03",
          followedUpAt: "2026-10-04T10:00:00.000Z",
        }}
        today="2026-10-05"
      />,
    );
    expect(html).toContain("Gave their life to Christ");
    expect(html).toContain("Being followed up");
    expect(html).toContain("Follow-up due");
    expect(html).toContain("Followed up");
    expect(html).not.toContain("Not sure yet");

    const later = renderToStaticMarkup(
      <ContactStatusBadges
        contact={{ ...base, nextFollowUpDate: "2026-10-09" }}
        today="2026-10-05"
      />,
    );
    expect(later).toContain("Next");
    expect(later).not.toContain("Follow-up due");
  });
});

describe("MemberActivityList", () => {
  test("describes each activity with its place, numbers and note", () => {
    const html = renderToStaticMarkup(
      <MemberActivityList
        activities={[
          {
            ...emptyMinistryNumbers(),
            id: 1,
            activityDate: "2026-10-05",
            kind: "outreach",
            title: null,
            mode: "both",
            platform: "whatsapp",
            location: "Ikeja market",
            note: "Good day.",
            peopleCount: 3,
            reachedOnline: 10,
            reachedOffline: 2,
            saved: 1,
          },
          {
            ...emptyMinistryNumbers(),
            id: 2,
            activityDate: "2026-10-05",
            kind: "teaching_meeting",
            title: "Youth fellowship",
            mode: null,
            platform: null,
            location: null,
            note: null,
            peopleCount: 0,
            attendance: 40,
          },
        ]}
      />,
    );
    expect(html).toContain("Outreach");
    expect(html).toContain("Online and offline · WhatsApp · Ikeja market");
    expect(html).toContain("12 reached · 1 saved · 3 people");
    expect(html).toContain("Good day.");
    expect(html).toContain("Teaching meeting · Youth fellowship");
    expect(html).toContain("40 present");

    const quiet = renderToStaticMarkup(
      <MemberActivityList activities={[]} showNotes={false} />,
    );
    expect(quiet).toContain("Nothing logged.");
  });
});
