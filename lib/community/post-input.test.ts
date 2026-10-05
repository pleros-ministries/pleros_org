import { describe, expect, test } from "vitest";

import {
  POST_BODY_MAX,
  POST_TITLE_MAX,
  isWithinNewAccountCooldown,
  normalisePostInput,
} from "./post-input";

describe("normalisePostInput", () => {
  test("a discussion needs a title; the body is optional", () => {
    expect(normalisePostInput({ kind: "discussion", title: "  ", body: "Hi" })).toEqual({
      ok: false,
      error: "Give your discussion a title.",
    });
    expect(
      normalisePostInput({
        kind: "discussion",
        title: "  How do  you pray? ",
        body: "",
        topic: "question",
      }),
    ).toEqual({
      ok: true,
      value: {
        kind: "discussion",
        title: "How do you pray?",
        body: "",
        topic: "question",
      },
    });
  });

  test("an unknown discussion topic is dropped", () => {
    const result = normalisePostInput({
      kind: "discussion",
      title: "Welcome",
      topic: "politics",
    });
    expect(result.ok && result.value.topic).toBeNull();
  });

  test("an announcement needs a body or a photo and never carries a topic", () => {
    expect(normalisePostInput({ kind: "official", title: "Hello" })).toEqual({
      ok: false,
      error: "Write something or add a photo.",
    });
    expect(
      normalisePostInput({ kind: "official", body: "", hasImages: true }),
    ).toEqual({
      ok: true,
      value: { kind: "official", title: null, body: "", topic: null },
    });
    expect(
      normalisePostInput({
        kind: "official",
        title: "Update",
        body: " Service at 9am ",
        topic: "question",
      }),
    ).toEqual({
      ok: true,
      value: {
        kind: "official",
        title: "Update",
        body: "Service at 9am",
        topic: null,
      },
    });
  });

  test("length limits apply to both kinds", () => {
    expect(
      normalisePostInput({
        kind: "discussion",
        title: "x".repeat(POST_TITLE_MAX + 1),
      }).ok,
    ).toBe(false);
    expect(
      normalisePostInput({
        kind: "official",
        body: "x".repeat(POST_BODY_MAX + 1),
      }).ok,
    ).toBe(false);
  });
});

describe("isWithinNewAccountCooldown", () => {
  const now = new Date("2026-10-04T12:00:00Z");

  test("is true only inside the waiting period", () => {
    expect(
      isWithinNewAccountCooldown(new Date("2026-10-04T11:55:00Z"), 10, now),
    ).toBe(true);
    expect(
      isWithinNewAccountCooldown(new Date("2026-10-04T11:50:00Z"), 10, now),
    ).toBe(false);
  });

  test("a missing enrolment date never blocks", () => {
    expect(isWithinNewAccountCooldown(null, 10, now)).toBe(false);
  });
});
