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
/** A deep screen's focused header: its title and its true parent. */
export type DashboardFocus = { title: string; back: DashboardParent };

const YOU: DashboardParent = { href: "/dashboard", label: "Back to You" };
const COMMUNITY: DashboardParent = { href: "/dashboard/community", label: "Back to Community" };
const GROUPS: DashboardParent = { href: "/dashboard/community/groups", label: "Back to Groups" };
const MY_SOGP: DashboardParent = { href: "/dashboard/sogp", label: "Back to My SOGP" };

/**
 * The dashboard's hierarchy in one place, most specific first. Tab roots
 * (You, Community home, Groups, Feed, Inbox) have no entry and keep the
 * You/Community tabs; everything else gets "← Title" pointing at its parent.
 */
const DASHBOARD_FOCUS: Array<[RegExp, (match: RegExpMatchArray) => DashboardFocus]> = [
  // My SOGP and learning
  [/^\/dashboard\/sogp$/, () => ({ title: "My SOGP", back: YOU })],
  [/^\/dashboard\/sogp\/course\/day\/(\d+)\/(quiz|response)$/, m => ({ title: m[2] === "quiz" ? "Quiz" : "Written response", back: { href: `/dashboard/sogp/course/day/${m[1]}`, label: "Back to lesson" } })],
  [/^\/dashboard\/sogp\/course\/day\/\d+$/, () => ({ title: "Lesson", back: MY_SOGP })],
  [/^\/dashboard\/sogp\/reviews\/schedule$/, () => ({ title: "Schedule group review", back: { href: "/dashboard/sogp/reviews", label: "Back to group reviews" } })],
  [/^\/dashboard\/sogp\/reviews\/\d+\/(attendance|make-up-offer|make-up)$/, m => ({ title: m[1] === "attendance" ? "Confirm attendance" : m[1] === "make-up-offer" ? "Offer a make-up" : "Make up a review", back: { href: "/dashboard/sogp/reviews", label: "Back to group reviews" } })],
  [/^\/dashboard\/sogp\/reviews$/, () => ({ title: "Group reviews", back: MY_SOGP })],
  [/^\/dashboard\/sogp\/follow-up\/(request|welcome)$/, m => ({ title: m[1] === "request" ? "Follow-up request" : "Welcome to SOGP", back: { href: "/dashboard/sogp/follow-up", label: "Back to your follow-up person" } })],
  [/^\/dashboard\/sogp\/enrollees\/\d+\/invite$/, () => ({ title: "Invite to a group", back: { href: "/dashboard/sogp/enrollees", label: "Back to My enrollees" } })],
  [/^\/dashboard\/sogp\/enrollees$/, () => ({ title: "My enrollees", back: COMMUNITY })],
  [/^\/dashboard\/sogp\/invitations\/\d+(\/sent)?$/, () => ({ title: "Group invitation", back: COMMUNITY })],
  [/^\/dashboard\/sogp\/(path|plan|listen|follow-up|readiness|referrals|leaderboard|certificate|traditional)$/, m => ({
    title: ({ path: "Your learning path", plan: "Edit full plan", listen: "Today’s listening", "follow-up": "Your follow-up person", readiness: "Certification", referrals: "Your SOGP referral", leaderboard: "Leaderboard", certificate: "Certificate", traditional: "Calendar and assessments" } as Record<string, string>)[m[1]],
    back: MY_SOGP,
  })],
  [/^\/dashboard\/sogp\/.+$/, () => ({ title: "My SOGP", back: MY_SOGP })],
  // Reports and contacts (You)
  [/^\/dashboard\/community\/report\/people\/private\/(\d+)\/invite$/, m => ({ title: "Share group invitation", back: { href: `/dashboard/community/report/people/private/${m[1]}`, label: "Back to contact" } })],
  [/^\/dashboard\/community\/report\/people\/(new|private\/\d+)$/, m => ({ title: m[1] === "new" ? "Add contact" : "Contact details", back: { href: "/dashboard/community/report/people", label: "Back to saved contacts" } })],
  [/^\/dashboard\/community\/report\/people$/, () => ({ title: "Saved contacts", back: { href: "/dashboard/community/report", label: "Back to my reports" } })],
  [/^\/dashboard\/community\/report\/(history|new|\d+)$/, m => ({ title: m[1] === "history" ? "Report history" : m[1] === "new" ? "New report" : "Edit activity", back: { href: "/dashboard/community/report", label: "Back to my reports" } })],
  [/^\/dashboard\/community\/report\/.+$/, () => ({ title: "My reports", back: { href: "/dashboard/community/report", label: "Back to my reports" } })],
  [/^\/dashboard\/community\/report$/, () => ({ title: "My reports", back: YOU })],
  // Community deep screens
  [/^\/dashboard\/community\/discipleship\/(\d+)\/disciples\/\d+$/, m => ({ title: "Disciple", back: { href: `/dashboard/community/discipleship/${m[1]}`, label: "Back to group" } })],
  [/^\/dashboard\/community\/(unit\/\d+|groups\/\d+|discipleship\/\d+|discipleship)$/, () => ({ title: "Group", back: GROUPS })],
  [/^\/dashboard\/community\/post\/\d+$/, () => ({ title: "Post", back: { href: "/dashboard/community/feed", label: "Back to Feed" } })],
  [/^\/dashboard\/community\/messages\/\d+$/, () => ({ title: "Conversation", back: { href: "/dashboard/community/messages", label: "Back to Inbox" } })],
  [/^\/dashboard\/community\/ask\/\d+$/, () => ({ title: "Your question", back: { href: "/dashboard/community/ask", label: "Back to Ask Pleros" } })],
  [/^\/dashboard\/community\/leader$/, () => ({ title: "Leader tools", back: COMMUNITY })],
  // Church oversight
  [/^\/dashboard\/church$/, () => ({ title: "Church oversight", back: COMMUNITY })],
  [/^\/dashboard\/church\/(?!branches|units|reports)[^/]+$/, () => ({ title: "Report details", back: { href: "/dashboard/church/reports", label: "Back to Church oversight" } })],
  [/^\/dashboard\/church\/.+$/, m => ({ title: /branches\/new|\/pastor$/.test(m[0]) ? "Church setup" : /units\/new/.test(m[0]) ? "Add a unit" : /\/leader$/.test(m[0]) ? "Unit appointment" : /\/workers$/.test(m[0]) ? "Assign workers" : "Church oversight", back: { href: "/dashboard/church", label: "Back to Church oversight" } })],
  // More from Pleros (You)
  [/^\/dashboard\/podcast\/leaderboard$/, () => ({ title: "Podcast leaderboard", back: { href: "/dashboard/podcast", label: "Back to Podcast" } })],
  [/^\/dashboard\/discipleship-journey\/[^/]+$/, () => ({ title: "Discipleship journey", back: { href: "/dashboard/discipleship-journey", label: "Back to discipleship journey" } })],
  [/^\/dashboard\/welcomepack\/.+$/, () => ({ title: "Welcome Pack", back: { href: "/dashboard/welcomepack", label: "Back to Welcome Pack" } })],
  [/^\/dashboard\/(podcast|prayer-watch|pre-sogp|welcomepack|profile|discipleship-journey)(\/.*)?$/, m => ({
    title: ({ podcast: "Podcast", "prayer-watch": "Prayer Watch", "pre-sogp": "Pre-SOGP", welcomepack: "Welcome Pack", profile: "Profile and settings", "discipleship-journey": "Discipleship journey" } as Record<string, string>)[m[1]],
    back: YOU,
  })],
];

/** The focused header for a deep screen, or null for a tab root. */
export function dashboardFocusForPath(href: string): DashboardFocus | null {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/dashboard";
  for (const [pattern, focus] of DASHBOARD_FOCUS) {
    const match = path.match(pattern);
    if (match) return focus(match);
  }
  return null;
}

/** Area roots never appear in a trail: the You/Community tabs already name them. */
const AREA_ROOTS = new Set(["/dashboard", "/dashboard/community"]);

/** "Back to saved contacts" → "Saved contacts". */
function crumbLabel(parent: DashboardParent) {
  const label = parent.label.replace(/^Back to (your )?/i, "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * The ancestors of a deep screen, outermost first, for the breadcrumb under
 * the header: each parent's parent until an area root. Pages can rename a
 * crumb (a group's real name) through the shell's crumb labels.
 */
export function dashboardTrailForPath(href: string): DashboardParent[] {
  const trail: DashboardParent[] = [];
  let focus = dashboardFocusForPath(href);
  while (focus && !AREA_ROOTS.has(focus.back.href) && trail.length < 6) {
    trail.unshift({ href: focus.back.href, label: crumbLabel(focus.back) });
    focus = dashboardFocusForPath(focus.back.href);
  }
  return trail;
}

/** Each deep screen's true parent; tab roots step back to their area. */
export function dashboardParentForPath(href: string): DashboardParent {
  const focus = dashboardFocusForPath(href);
  if (focus) return focus.back;
  return dashboardAreaForPath(href) === "community" ? COMMUNITY : YOU;
}
