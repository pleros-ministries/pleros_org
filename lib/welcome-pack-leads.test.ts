import { describe, expect, test } from "vitest";

import {
  buildWelcomeLeadUpsertValues,
  resolveWelcomePackAccessState,
  serializeWelcomeLeadSummary,
} from "./welcome-pack-leads";

describe("welcome pack lead state", () => {
  test("normalizes new welcome leads with main access granted and extras locked", () => {
    expect(
      buildWelcomeLeadUpsertValues({
        email: " Grace@Example.COM ",
        name: " Grace ",
        source: " welcome-ad ",
      }),
    ).toMatchObject({
      email: "grace@example.com",
      name: "Grace",
      source: "welcome-ad",
      mainAccessGranted: true,
      extraGiftsUnlocked: false,
      sharedConfirmedAt: null,
    });
  });

  test("falls back to a stable public source when none is provided", () => {
    expect(
      buildWelcomeLeadUpsertValues({
        email: "hello@example.com",
        name: "",
        source: "",
      }),
    ).toMatchObject({
      email: "hello@example.com",
      name: null,
      source: "welcome",
      mainAccessGranted: true,
    });
  });

  test("resolves main and extra gift access from persisted lead state", () => {
    expect(resolveWelcomePackAccessState(null)).toEqual({
      mainGiftsAccessible: true,
      extraGiftsUnlocked: false,
    });
    expect(
      resolveWelcomePackAccessState({
        mainAccessGranted: true,
        extraGiftsUnlocked: true,
      }),
    ).toEqual({
      mainGiftsAccessible: true,
      extraGiftsUnlocked: true,
    });
  });

  test("serializes lead summaries without leaking Date objects to admin UI", () => {
    expect(
      serializeWelcomeLeadSummary({
        id: 9,
        email: "hello@example.com",
        name: null,
        source: "welcome",
        mainAccessGranted: true,
        extraGiftsUnlocked: true,
        sharedConfirmedAt: new Date("2026-06-09T08:00:00.000Z"),
        createdAt: new Date("2026-06-09T07:30:00.000Z"),
        updatedAt: new Date("2026-06-09T08:00:00.000Z"),
      }),
    ).toEqual({
      id: 9,
      email: "hello@example.com",
      name: null,
      source: "welcome",
      mainAccessGranted: true,
      extraGiftsUnlocked: true,
      sharedConfirmedAt: "2026-06-09T08:00:00.000Z",
      createdAt: "2026-06-09T07:30:00.000Z",
      updatedAt: "2026-06-09T08:00:00.000Z",
    });
  });
});
