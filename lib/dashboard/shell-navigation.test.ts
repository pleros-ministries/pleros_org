import { describe, expect, test } from "vitest";
import { buildDashboardNavigation, type DashboardCapabilities } from "./navigation";
import { dashboardAreaForPath, dashboardAreaHref, dashboardParentForPath, dashboardWorkspace } from "./shell-navigation";

const member: DashboardCapabilities = { sogpEnrolled: true, community: true, communityUnitId: 9, discipleshipDiscussions: true, managesLocationGroups: false, staffConsole: false };

describe("connected dashboard navigation", () => {
  test("personal reporting remains You despite the community route namespace", () => {
    for (const path of ["/dashboard", "/dashboard/community/report", "/dashboard/community/report/people", "/dashboard/community/report/history?day=2026-10-13", "/dashboard/church", "/dashboard/community-other", "/dashboard/sogp/discipleship-other"]) expect(dashboardAreaForPath(path)).toBe("you");
    for (const path of ["/dashboard/community", "/dashboard/community/messages/4", "/dashboard/community/ask", "/dashboard/community/leader"]) expect(dashboardAreaForPath(path)).toBe("community");
  });
  test("discipleship belongs to Community without changing its canonical route", () => {
    const sections = buildDashboardNavigation(member);
    for (const path of ["/dashboard/sogp/discipleship", "/dashboard/sogp/discipleship?group=42", "/dashboard/sogp/discipleship/42"]) {
      expect(dashboardAreaForPath(path)).toBe("community");
      expect(dashboardAreaHref("community", sections, path)).toBe(path);
      expect(dashboardAreaHref("you", sections, path)).toBe("/dashboard");
    }
    expect(sections.find(section => section.key === "community")?.items.some(item => item.key === "disciples")).toBe(true);
    expect(sections.find(section => section.key === "oversight")?.items.some(item => item.key === "disciples") ?? false).toBe(false);
  });
  test("workspace links are derived from authorised navigation, not role labels", () => {
    const ordinary = dashboardWorkspace(buildDashboardNavigation(member));
    expect(ordinary.map(item => item.label)).toEqual(["My learning", "Saved contacts"]);
    expect(ordinary.some(item => item.href === "/dashboard/church")).toBe(false);
    expect(dashboardWorkspace(buildDashboardNavigation({ ...member, churchOversight: true })).some(item => item.label === "Church oversight")).toBe(true);
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
    expect(dashboardAreaHref("you", sections, "/dashboard/community/report?day=2026-10-12")).toBe("/dashboard/community/report?day=2026-10-12");
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
    expect(dashboardParentForPath("/dashboard/sogp")).toEqual({ href: "/dashboard", label: "Back to You" });
    expect(dashboardParentForPath("/dashboard/sogp/plan")).toEqual({ href: "/dashboard/sogp", label: "Back to My SOGP" });
    expect(dashboardParentForPath("/dashboard/sogp/reviews/42/attendance")).toEqual({ href: "/dashboard/sogp/reviews", label: "Back to group reviews" });
    expect(dashboardParentForPath("/dashboard/sogp/course/day/4/quiz")).toEqual({ href: "/dashboard/sogp/course/day/4", label: "Back to lesson" });
    expect(dashboardParentForPath("/dashboard/community/report/people/new")).toEqual({ href: "/dashboard/community/report/people", label: "Back to saved contacts" });
    expect(dashboardParentForPath("/dashboard/community/report/history")).toEqual({ href: "/dashboard/community/report", label: "Back to my reports" });
  });
});
