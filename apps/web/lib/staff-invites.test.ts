import { describe, expect, test } from "vitest";

import {
  buildStaffInviteUrl,
  getStaffInviteExpiry,
  getStaffInviteStatus,
  hashStaffInviteToken,
  isStaffInviteRole,
} from "./staff-invites";

describe("staff invite helpers", () => {
  test("identifies inviteable staff roles", () => {
    expect(isStaffInviteRole("admin")).toBe(true);
    expect(isStaffInviteRole("instructor")).toBe(true);
    expect(isStaffInviteRole("super_admin")).toBe(false);
    expect(isStaffInviteRole("student")).toBe(false);
  });

  test("hashes tokens deterministically without exposing the token", () => {
    const hash = hashStaffInviteToken("invite-token");

    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashStaffInviteToken("invite-token"));
    expect(hash).not.toContain("invite-token");
  });

  test("builds invite urls from the configured app origin", () => {
    expect(buildStaffInviteUrl("https://pleros.org/", "abc 123")).toBe(
      "https://pleros.org/admin/invite/abc%20123",
    );
  });

  test("sets invite expiry seven days out", () => {
    expect(getStaffInviteExpiry(new Date("2026-06-10T12:00:00.000Z")).toISOString()).toBe(
      "2026-06-17T12:00:00.000Z",
    );
  });

  test("derives invite status from lifecycle timestamps", () => {
    expect(
      getStaffInviteStatus({
        acceptedAt: null,
        revokedAt: null,
        expiresAt: "2026-06-11T12:00:00.000Z",
        now: "2026-06-10T12:00:00.000Z",
      }),
    ).toBe("pending");

    expect(
      getStaffInviteStatus({
        acceptedAt: "2026-06-10T12:00:00.000Z",
        revokedAt: null,
        expiresAt: "2026-06-11T12:00:00.000Z",
      }),
    ).toBe("accepted");

    expect(
      getStaffInviteStatus({
        acceptedAt: null,
        revokedAt: "2026-06-10T12:00:00.000Z",
        expiresAt: "2026-06-11T12:00:00.000Z",
      }),
    ).toBe("revoked");

    expect(
      getStaffInviteStatus({
        acceptedAt: null,
        revokedAt: null,
        expiresAt: "2026-06-09T12:00:00.000Z",
        now: "2026-06-10T12:00:00.000Z",
      }),
    ).toBe("expired");
  });
});

