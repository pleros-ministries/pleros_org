import type { DashboardArea } from "./swipe-tabs";
import type { DashboardNavSection } from "./navigation";

export function dashboardAreaForPath(href: string): DashboardArea {
  const path = href.split(/[?#]/)[0];
  const inCommunity = path === "/dashboard/community" || path.startsWith("/dashboard/community/");
  const reporting = path === "/dashboard/community/report" || path.startsWith("/dashboard/community/report/");
  const discipleship = ["/dashboard/sogp/discipleship", "/dashboard/sogp/enrollees", "/dashboard/sogp/invitations"].some(root => path === root || path.startsWith(`${root}/`));
  return discipleship || inCommunity && !reporting ? "community" : "you";
}

/** Presentation only. Every destination retains its own server guard. */
export function dashboardAreaHref(area: DashboardArea, sections: DashboardNavSection[], remembered?: string): string | null {
  const feed = sections.flatMap(section => section.items).find(item => item.key === "feed");
  if (area === "community" && !feed) return null;
  const fallback = area === "you" ? "/dashboard" : "/dashboard/community";
  if (!remembered?.startsWith("/dashboard") || remembered.startsWith("//")) return fallback;
  const path = remembered.split(/[?#]/)[0];
  if (path !== "/dashboard" && !path.startsWith("/dashboard/")) return fallback;
  return dashboardAreaForPath(path) === area ? remembered : fallback;
}

export type DashboardWorkspaceItem = { key: string; label: string; href: string; icon: "book" | "leaf" | "people" | "building" };
export function dashboardWorkspace(sections: DashboardNavSection[]): DashboardWorkspaceItem[] {
  const items = sections.flatMap(section => section.items);
  const find = (key: string) => items.find(item => item.key === key);
  const workspace: DashboardWorkspaceItem[] = [];
  const learning = find("sogp") ?? find("sogp-enrol");
  if (learning) workspace.push({ ...learning, label: "My learning", icon: "book" });
  const contacts = find("contacts");
  if (contacts) workspace.push({ ...contacts, label: "Saved contacts", icon: "people" });
  const church = find("church");
  if (church) workspace.push({ ...church, icon: "building" });
  const staff = find("admin") ?? find("instructor-workspace") ?? find("pastor-workspace");
  if (staff) workspace.push({ ...staff, icon: staff.key === "pastor-workspace" ? "people" : "building" });
  return workspace;
}

export type DashboardParent = { href: string; label: string };

/** Each deep screen's true parent, most specific first. Unknown paths step up one segment. */
const DASHBOARD_PARENTS: Array<[RegExp, (match: RegExpMatchArray) => DashboardParent]> = [
  [/^\/dashboard\/sogp\/course\/day\/(\d+)\/(quiz|response)$/, match => ({ href: `/dashboard/sogp/course/day/${match[1]}`, label: "Back to lesson" })],
  [/^\/dashboard\/sogp\/reviews\/[^/]+(\/.*)?$/, () => ({ href: "/dashboard/sogp/reviews", label: "Back to group reviews" })],
  [/^\/dashboard\/sogp\/.+$/, () => ({ href: "/dashboard/sogp", label: "Back to My SOGP" })],
  [/^\/dashboard\/sogp$/, () => ({ href: "/dashboard", label: "Back to You" })],
  [/^\/dashboard\/community\/report\/people\/.+$/, () => ({ href: "/dashboard/community/report/people", label: "Back to saved contacts" })],
  [/^\/dashboard\/community\/report\/.+$/, () => ({ href: "/dashboard/community/report", label: "Back to my reports" })],
  [/^\/dashboard\/community\/report$/, () => ({ href: "/dashboard", label: "Back to You" })],
];

export function dashboardParentForPath(href: string): DashboardParent {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "");
  for (const [pattern, parent] of DASHBOARD_PARENTS) {
    const match = path.match(pattern);
    if (match) return parent(match);
  }
  const area = dashboardAreaForPath(path);
  return area === "community" ? { href: "/dashboard/community", label: "Back to Community" } : { href: "/dashboard", label: "Back to You" };
}
