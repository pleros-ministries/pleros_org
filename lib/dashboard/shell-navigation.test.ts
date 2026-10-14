import { describe, expect, test } from "vitest";
import { buildDashboardNavigation, type DashboardCapabilities } from "./navigation";
import { dashboardAreaForPath, dashboardAreaHref, dashboardWorkspace } from "./shell-navigation";

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
});
