import type { DashboardArea } from "./swipe-tabs";
import type { DashboardNavSection } from "./navigation";

export function dashboardAreaForPath(href: string): DashboardArea {
  const path = href.split(/[?#]/)[0];
  const inCommunity = path === "/dashboard/community" || path.startsWith("/dashboard/community/");
  const reporting = path === "/dashboard/community/report" || path.startsWith("/dashboard/community/report/");
  const discipleship = path === "/dashboard/sogp/discipleship" || path.startsWith("/dashboard/sogp/discipleship/");
  return discipleship || inCommunity && !reporting ? "community" : "you";
}

/** Presentation only. Every destination retains its own server guard. */
export function dashboardAreaHref(area: DashboardArea, sections: DashboardNavSection[], remembered?: string): string | null {
  const feed = sections.flatMap(section => section.items).find(item => item.key === "feed");
  if (area === "community" && !feed) return null;
  const fallback = area === "you" ? "/dashboard" : feed!.href;
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
  return workspace;
}
