import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

describe("Community home performance contract", () => {
  test("uses compact home projections instead of full feature payloads", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib/db/queries/community-home.ts"),
      "utf8",
    );
    expect(source).toContain("countUnreadConversations(ctx.userId)");
    expect(source).toContain("getCommunityHomeDiscipleship(ctx.userId)");
    expect(source).toContain("listOwnActiveCommunityGroups(ctx.userId)");
    expect(source).not.toContain("listConversations(ctx.userId)");
    expect(source).not.toContain("listGroupDirectory(ctx.userId)");
    expect(source).not.toContain("getCommunityDiscipleship(ctx)");
  });

  test("prefetches root tabs and keeps the switch animation brief", () => {
    const shell = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/shell/dashboard-shell.tsx"),
      "utf8",
    );
    const swipe = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/v3/use-tab-swipe.ts"),
      "utf8",
    );
    expect(shell).toContain('router.prefetch("/dashboard")');
    expect(shell).toContain("router.prefetch(communityHref)");
    expect(swipe).toContain("duration: 0.28");
  });

  test("keeps background badges lightweight and out of the navigation path", () => {
    const notifications = fs.readFileSync(
      path.join(process.cwd(), "components/community/notification-bell.tsx"),
      "utf8",
    );
    const messages = fs.readFileSync(
      path.join(process.cwd(), "components/community/messages/use-unread-messages.ts"),
      "utf8",
    );
    expect(notifications).toContain("/api/community/notifications?summary=1");
    expect(notifications).toContain("enabled: open");
    expect(notifications).toContain("refetchInterval: 120_000");
    expect(messages).toContain("refetchInterval: 120_000");
    expect(messages).toContain("refetchOnWindowFocus: false");
  });

  test("uses the approved Community home copy", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "components/community/community-home-v3.tsx"),
      "utf8",
    );
    expect(source).toContain("<h1>Your Pleros Community</h1>");
    expect(source).not.toContain("Your people.");
  });
});
