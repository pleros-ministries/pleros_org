import { describe, expect, it } from "vitest";

import { clockLabel, durationLabel, meetingLine, meetingMinutes, parseMeetingInput, parseNoReason } from "./meeting-report";

describe("meeting length", () => {
  it("counts the minutes between start and end", () => {
    expect(meetingMinutes("18:00", "19:30")).toBe(90);
    expect(durationLabel(90)).toBe("1 hr 30 min");
    expect(durationLabel(45)).toBe("45 min");
  });

  it("runs past midnight when the end is before the start", () => {
    expect(meetingMinutes("22:00", "04:00")).toBe(360);
    expect(durationLabel(360)).toBe("6 hr");
  });

  it("writes clock times plainly", () => {
    expect(clockLabel("18:00")).toBe("6 pm");
    expect(clockLabel("07:05")).toBe("7:05 am");
    expect(clockLabel("00:30")).toBe("12:30 am");
  });
});

describe("parseMeetingInput", () => {
  const led = { kind: "teaching", role: "led", emphasis: "Faith that works", startsAt: "18:00", endsAt: "19:30", venue: "Church hall", workers: 3, members: 20 };

  it("accepts a led teaching meeting", () => {
    const result = parseMeetingInput(led);
    expect(result.ok && result.value).toMatchObject({ kind: "teaching", role: "led", workers: 3, members: 20, venue: "Church hall" });
  });

  it("needs the emphasis for teaching but not for prayer", () => {
    expect(parseMeetingInput({ ...led, emphasis: " " })).toEqual({ ok: false, error: "Add the teaching emphasis." });
    const prayer = parseMeetingInput({ ...led, kind: "prayer", emphasis: "ignored" });
    expect(prayer.ok && prayer.value.emphasis).toBeNull();
  });

  it("needs times, a venue and someone present when led", () => {
    expect(parseMeetingInput({ ...led, startsAt: "6pm" }).ok).toBe(false);
    expect(parseMeetingInput({ ...led, endsAt: "18:00" }).ok).toBe(false);
    expect(parseMeetingInput({ ...led, venue: "" }).ok).toBe(false);
    expect(parseMeetingInput({ ...led, workers: 0, members: 0 }).ok).toBe(false);
  });

  it("asks only for people brought when attended", () => {
    const result = parseMeetingInput({ kind: "prayer", role: "attended", brought: 2, venue: "ignored", workers: 9 });
    expect(result.ok && result.value).toMatchObject({ role: "attended", brought: 2, venue: null, workers: null });
    expect(parseMeetingInput({ kind: "prayer", role: "attended", brought: 51 }).ok).toBe(false);
  });

  it("takes an outreach meeting with no led or attended", () => {
    const result = parseMeetingInput({ kind: "outreach", role: "led", workers: 4 });
    expect(result.ok && result.value).toMatchObject({ kind: "outreach", role: null, workers: null });
  });
});

describe("parseNoReason", () => {
  it("needs a short reason", () => {
    expect(parseNoReason("  ").ok).toBe(false);
    expect(parseNoReason(" I was unwell ")).toEqual({ ok: true, value: "I was unwell" });
    expect(parseNoReason("x".repeat(301)).ok).toBe(false);
  });
});

describe("meetingLine", () => {
  it("sums up a led meeting", () => {
    expect(meetingLine({ role: "led", emphasis: "Faith that works", startsAt: "18:00", endsAt: "19:30", venue: "Church hall", workers: 3, members: 20, brought: 0 }))
      .toBe("Faith that works · 6 pm to 7:30 pm (1 hr 30 min) · Church hall · 23 present");
  });

  it("sums up an attended meeting", () => {
    expect(meetingLine({ role: "attended", emphasis: null, startsAt: null, endsAt: null, venue: null, workers: null, members: null, brought: 2 })).toBe("Brought 2 people");
  });
});
