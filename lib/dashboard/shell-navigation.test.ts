import { describe, expect, test } from "vitest";
import { buildDashboardNavigation, type DashboardCapabilities } from "./navigation";
import { dashboardAreaForPath, dashboardAreaHref, dashboardFocusForPath, dashboardParentForPath, dashboardTrailForPath, dashboardWorkspace } from "./shell-navigation";

const member: DashboardCapabilities = { sogpEnrolled: true, community: true, communityUnitId: 9, discipleshipDiscussions: true, managesLocationGroups: false, staffConsole: false };

describe("connected dashboard navigation", () => {
  test("reports are a Community tab; the You tabs and similar-looking paths stay You", () => {
    for (const path of ["/dashboard", "/dashboard/sogp", "/dashboard/library", "/dashboard/library/teachings", "/dashboard/partner", "/dashboard/profile", "/dashboard/churchyard", "/dashboard/community-other", "/dashboard/sogp/discipleship-other"]) expect(dashboardAreaForPath(path)).toBe("you");
    for (const path of ["/dashboard/church", "/dashboard/church/reports", "/dashboard/community", "/dashboard/community/report", "/dashboard/community/report/history?day=2026-10-13", "/dashboard/community/messages/4", "/dashboard/community/ask", "/dashboard/community/leader"]) expect(dashboardAreaForPath(path)).toBe("community");
  });
  test("discipleship belongs to Community and lives on each group's page", () => {
    const sections = buildDashboardNavigation(member);
    for (const path of ["/dashboard/sogp/discipleship", "/dashboard/sogp/discipleship?group=42", "/dashboard/community/discipleship/42", "/dashboard/community/discipleship/42/disciples/7"]) {
      expect(dashboardAreaForPath(path)).toBe("community");
      expect(dashboardAreaHref("community", sections, path)).toBe(path);
      expect(dashboardAreaHref("you", sections, path)).toBe("/dashboard");
    }
    // My disciples is retired: Groups lists every discipleship group.
    expect(sections.find(section => section.key === "community")?.items.some(item => item.key === "disciples")).toBe(false);
    expect(dashboardParentForPath("/dashboard/community/discipleship/42")).toEqual({ href: "/dashboard/community/groups", label: "Back to Groups" });
    expect(dashboardParentForPath("/dashboard/community/discipleship/42/disciples/7")).toEqual({ href: "/dashboard/community/discipleship/42", label: "Back to group" });
    expect(sections.find(section => section.key === "oversight")?.items.some(item => item.key === "disciples") ?? false).toBe(false);
  });
  test("workspace links are derived from authorised navigation, not role labels", () => {
    const ordinary = dashboardWorkspace(buildDashboardNavigation(member));
    expect(ordinary.map(item => item.label)).toEqual(["My learning"]);
    expect(ordinary.some(item => item.href === "/dashboard/church")).toBe(false);
    expect(dashboardWorkspace(buildDashboardNavigation({ ...member, groupOversight: true })).some(item => item.label === "Oversight")).toBe(true);
  });
  test("staff receive a role-scoped workspace destination", () => {
    const cases = [
      ["admin", "Admin", "/admin"],
      ["super_admin", "Admin", "/admin"],
      ["instructor", "Instructor workspace", "/admin"],
      ["pastor", "My enrollees", "/admin/my-enrollees"],
    ] as const;

    for (const [staffWorkspace, label, href] of cases) {
      const workspace = dashboardWorkspace(
        buildDashboardNavigation({ ...member, staffConsole: false, staffWorkspace }),
      );
      expect(workspace).toContainEqual(expect.objectContaining({ label, href }));
    }
  });
  test("church Pastor and Branch Pastor appointments receive the Admin workspace", () => {
    for (const churchAdministration of ["pastor", "branch_pastor"] as const) {
      const workspace = dashboardWorkspace(
        buildDashboardNavigation({
          ...member,
          staffConsole: false,
          staffWorkspace: undefined,
          churchAdministration,
        }),
      );
      expect(workspace).toContainEqual(expect.objectContaining({ label: "Admin", href: "/admin" }));
    }
  });
  test("church-only reporting does not grant community feed access", () => {
    const sections = buildDashboardNavigation({ ...member, community: false, sogpEnrolled: false, reporting: true, discipleshipDiscussions: false });
    expect(dashboardAreaHref("community", sections)).toBeNull();
    expect(dashboardWorkspace(sections).some(item => item.label === "Saved contacts")).toBe(true);
    expect(dashboardWorkspace(sections).some(item => item.label === "My disciples")).toBe(false);
  });
  test("restores internal destinations and query strings without accepting external URLs", () => {
    const sections = buildDashboardNavigation(member);
    expect(dashboardAreaHref("you", sections, "/dashboard/sogp/days?from=home")).toBe("/dashboard/sogp/days?from=home");
    expect(dashboardAreaHref("community", sections, "/dashboard/community/report?day=2026-10-12")).toBe("/dashboard/community/report?day=2026-10-12");
    expect(dashboardAreaHref("community", sections, "/dashboard/community/messages/4")).toBe("/dashboard/community/messages/4");
    for (const unsafe of ["https://evil.test/dashboard/community", "//evil.test/dashboard/community", "javascript:alert(1)", "/admin", "/dashboard/communityish"]) expect(dashboardAreaHref("community", sections, unsafe)).toBe("/dashboard/community");
  });
  test("keeps the existing destination inventory alongside the workspace", () => {
    const sections = buildDashboardNavigation({ ...member, staffConsole: true, churchOversight: true });
    const hrefs = sections.flatMap(section => section.items.map(item => item.href));
    for (const href of ["/dashboard/community/report/history", "/dashboard/podcast", "/dashboard/sogp/certificate", "/dashboard/community/messages", "/dashboard/community/ask", "/dashboard/welcomepack/setup", "/admin"]) {
      expect(hrefs).toContain(href);
    }
  });
  test("deep dashboard screens return to their actual parent instead of a generic root", () => {
    // The You tabs are roots like Community's: no focused header.
    for (const tab of ["/dashboard/sogp", "/dashboard/library", "/dashboard/partner", "/dashboard/profile", "/dashboard/community/report"]) expect(dashboardFocusForPath(tab)).toBeNull();
    expect(dashboardParentForPath("/dashboard/sogp/plan")).toEqual({ href: "/dashboard/sogp", label: "Back to Learning" });
    // Trails under You start at You; Community trails stop at their bottom-bar tab.
    expect(dashboardTrailForPath("/dashboard/sogp/course/day/4/quiz").map(crumb => crumb.label)).toEqual(["You", "Learning", "Lesson"]);
    expect(dashboardTrailForPath("/dashboard/sogp/days").map(crumb => crumb.label)).toEqual(["You", "Learning"]);
    expect(dashboardTrailForPath("/dashboard/library/teachings").map(crumb => crumb.label)).toEqual(["You", "Library"]);
    expect(dashboardParentForPath("/dashboard/podcast")).toEqual({ href: "/dashboard/library", label: "Back to Library" });
    expect(dashboardParentForPath("/dashboard/prayer-watch")).toEqual({ href: "/dashboard/sogp", label: "Back to Learning" });
    expect(dashboardTrailForPath("/dashboard/community/enrollees/7").map(crumb => crumb.label)).toEqual(["Community", "Groups", "My enrollees"]);
    expect(dashboardTrailForPath("/dashboard/community/groups").map(crumb => crumb.label)).toEqual(["Community"]);
    expect(dashboardParentForPath("/dashboard/sogp/reviews/42/attendance")).toEqual({ href: "/dashboard/sogp/reviews", label: "Back to group reviews" });
    expect(dashboardParentForPath("/dashboard/sogp/course/day/4/quiz")).toEqual({ href: "/dashboard/sogp/course/day/4", label: "Back to lesson" });
    expect(dashboardParentForPath("/dashboard/community/contacts/new")).toEqual({ href: "/dashboard/community/contacts", label: "Back to saved contacts" });
    expect(dashboardParentForPath("/dashboard/community/contacts")).toEqual({ href: "/dashboard/community/groups", label: "Back to Groups" });
    expect(dashboardParentForPath("/dashboard/community/enrollees")).toEqual({ href: "/dashboard/community/groups", label: "Back to Groups" });
    expect(dashboardParentForPath("/dashboard/community/report/history")).toEqual({ href: "/dashboard/community/report", label: "Back to My reports" });
  });
});

describe("groups as oversight navigation", () => {
  const oversightItems = (caps: DashboardCapabilities) => buildDashboardNavigation(caps).flatMap(section => section.items).filter(item => item.key === "church");

  test("a group leader with members gets Oversight inside Community", () => {
    expect(oversightItems({ ...member, groupOversight: true })).toEqual([expect.objectContaining({ label: "Oversight", href: "/dashboard/community/oversight" })]);
  });

  test("an old church placement alone no longer adds a church page", () => {
    expect(oversightItems({ ...member, groupOversight: false, churchMember: true, churchOversight: true })).toEqual([]);
  });
});
