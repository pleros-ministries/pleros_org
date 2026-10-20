import type { DashboardArea } from "./swipe-tabs";
import type { DashboardNavSection } from "./navigation";

export function dashboardAreaForPath(href: string): DashboardArea {
  const path = href.split(/[?#]/)[0];
  const inCommunity = path === "/dashboard/community" || path.startsWith("/dashboard/community/");
  // Reports is a Community tab (Pastor review, 18 October): you report to the people you're accountable to.
  // Church structure sits under Oversight, so it belongs to Community too.
  const discipleship = ["/dashboard/sogp/discipleship", "/dashboard/sogp/enrollees", "/dashboard/sogp/invitations", "/dashboard/church"].some(root => path === root || path.startsWith(`${root}/`));
  return discipleship || inCommunity ? "community" : "you";
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
  // Saved contacts lives under Groups; only viewers without Community keep it here.
  const contacts = find("feed") ? undefined : find("contacts");
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
const MY_SOGP: DashboardParent = { href: "/dashboard/sogp", label: "Back to Learning" };
const LIBRARY: DashboardParent = { href: "/dashboard/library", label: "Back to Library" };
const REPORTS: DashboardParent = { href: "/dashboard/community/report", label: "Back to My reports" };

/**
 * The You bottom bar's tabs (Home, Learning, Library, Partner, Profile). They
 * keep the You/Community header like Community's tabs, and trails under them
 * start at You.
 */
export const YOU_TABS = ["/dashboard", "/dashboard/sogp", "/dashboard/library", "/dashboard/partner", "/dashboard/profile"] as const;

/**
 * The dashboard's hierarchy in one place, most specific first. Tab roots
 * (the You tabs, Community home, Feed, Inbox, Reports) have no entry and keep the
 * You/Community tabs; everything else gets "← Title" pointing at its parent.
 */
const DASHBOARD_FOCUS: Array<[RegExp, (match: RegExpMatchArray) => DashboardFocus]> = [
  // My SOGP and learning
  [/^\/dashboard\/sogp\/course\/day\/(\d+)\/(quiz|response)$/, m => ({ title: m[2] === "quiz" ? "Quiz" : "Written response", back: { href: `/dashboard/sogp/course/day/${m[1]}`, label: "Back to lesson" } })],
  [/^\/dashboard\/sogp\/course\/day\/\d+$/, () => ({ title: "Lesson", back: MY_SOGP })],
  [/^\/dashboard\/sogp\/reviews\/schedule$/, () => ({ title: "Schedule group review", back: { href: "/dashboard/sogp/reviews", label: "Back to group reviews" } })],
  [/^\/dashboard\/sogp\/reviews\/\d+\/(attendance|make-up-offer|make-up)$/, m => ({ title: m[1] === "attendance" ? "Confirm attendance" : m[1] === "make-up-offer" ? "Offer a make-up" : "Make up a review", back: { href: "/dashboard/sogp/reviews", label: "Back to group reviews" } })],
  [/^\/dashboard\/sogp\/reviews$/, () => ({ title: "Group reviews", back: MY_SOGP })],
  [/^\/dashboard\/sogp\/follow-up\/(request|welcome)$/, m => ({ title: m[1] === "request" ? "Follow-up request" : "Welcome to SOGP", back: { href: "/dashboard/sogp/follow-up", label: "Back to your follow-up person" } })],
  [/^\/dashboard\/profile\/reminders$/, () => ({ title: "Notifications and reminders", back: { href: "/dashboard/profile", label: "Back to Profile" } })],
  [/^\/dashboard\/community\/enrollees\/(\d+)\/invite$/, m => ({ title: "Invite to a group", back: { href: `/dashboard/community/enrollees/${m[1]}`, label: "Back to enrollee" } })],
  [/^\/dashboard\/community\/enrollees\/\d+$/, () => ({ title: "Enrollee", back: { href: "/dashboard/community/enrollees", label: "Back to My enrollees" } })],
  [/^\/dashboard\/(community|sogp)\/enrollees$/, () => ({ title: "My enrollees", back: GROUPS })],
  [/^\/dashboard\/community\/invitations\/\d+\/sent$/, () => ({ title: "Invitation", back: { href: "/dashboard/community/enrollees", label: "Back to My enrollees" } })],
  [/^\/dashboard\/sogp\/invitations\/\d+$/, () => ({ title: "Group invitation", back: COMMUNITY })],
  [/^\/dashboard\/sogp\/(days|path|plan|listen|follow-up|readiness|referrals|leaderboard|certificate|traditional|history)$/, m => ({
    title: ({ days: "Your SOGP days", history: "Your history", path: "Change path or pace", plan: "Edit full plan", listen: "Today’s listening", "follow-up": "Your follow-up person", readiness: "Certification", referrals: "Invite someone", leaderboard: "Leaderboard", certificate: "Certificate", traditional: "Calendar and assessments" } as Record<string, string>)[m[1]],
    back: MY_SOGP,
  })],
  [/^\/dashboard\/sogp\/.+$/, () => ({ title: "Learning", back: MY_SOGP })],
  // Contacts
  // Saved contacts sits under Groups (people on their way into a group).
  [/^\/dashboard\/community\/contacts\/(\d+)\/invite$/, m => ({ title: "Share group invitation", back: { href: `/dashboard/community/contacts/${m[1]}`, label: "Back to contact" } })],
  [/^\/dashboard\/community\/contacts\/(new|\d+)$/, m => ({ title: m[1] === "new" ? "Add contact" : "Contact details", back: { href: "/dashboard/community/contacts", label: "Back to saved contacts" } })],
  [/^\/dashboard\/community\/contacts$/, () => ({ title: "Saved contacts", back: GROUPS })],
  [/^\/dashboard\/community\/report\/(history|new|assignment|\d+)$/, m => ({ title: m[1] === "history" ? "Report history" : m[1] === "new" ? "New report" : m[1] === "assignment" ? "Natural assignment" : "Edit activity", back: REPORTS })],
  [/^\/dashboard\/community\/report\/.+$/, () => ({ title: "My reports", back: REPORTS })],
  // Community deep screens. Groups left the bottom bar (18 October), so it steps back to Community.
  [/^\/dashboard\/community\/groups$/, () => ({ title: "Groups", back: COMMUNITY })],
  [/^\/dashboard\/community\/discipleship\/(\d+)\/disciples\/\d+$/, m => ({ title: "Disciple", back: { href: `/dashboard/community/discipleship/${m[1]}`, label: "Back to group" } })],
  [/^\/dashboard\/community\/(unit\/\d+|groups\/\d+|discipleship\/\d+|discipleship)$/, () => ({ title: "Group", back: GROUPS })],
  [/^\/dashboard\/community\/post\/\d+$/, () => ({ title: "Post", back: { href: "/dashboard/community/feed", label: "Back to Feed" } })],
  [/^\/dashboard\/community\/messages\/\d+$/, () => ({ title: "Conversation", back: { href: "/dashboard/community/messages", label: "Back to Inbox" } })],
  [/^\/dashboard\/community\/ask\/\d+$/, () => ({ title: "Your question", back: { href: "/dashboard/community/ask", label: "Back to Ask Pleros" } })],
  [/^\/dashboard\/community\/leader$/, () => ({ title: "Leader tools", back: COMMUNITY })],
  // Oversight (Pastor, Branch Pastor) inside Community, with Overview · Reports · Structure tabs
  // (tab roots, no crumb). Setup screens keep their /dashboard/church routes and step back to
  // Structure; unit leaders and workers keep /dashboard/church and /dashboard/church/reports.
  [/^\/dashboard\/community\/oversight\/(branches(?:\/\d+)?|questions)$/, m => ({ title: m[1] === "questions" ? "Questions waiting" : m[1] === "branches" ? "Branches" : "Branch", back: { href: "/dashboard/community/oversight", label: "Back to Oversight" } })],
  [/^\/dashboard\/church$/, () => ({ title: "My church", back: COMMUNITY })],
  [/^\/dashboard\/church\/reports$/, () => ({ title: "Church reports", back: COMMUNITY })],
  [/^\/dashboard\/church\/(?!branches|units|reports)[^/]+$/, () => ({ title: "Report details", back: { href: "/dashboard/community/oversight/reports", label: "Back to Reports" } })],
  [/^\/dashboard\/church\/.+$/, m => ({ title: /branches\/new|\/pastor$/.test(m[0]) ? "Church setup" : /units\/new/.test(m[0]) ? "Add a unit" : /\/leader$/.test(m[0]) ? "Unit appointment" : /\/workers$/.test(m[0]) ? "Unit" : "Assign workers", back: { href: "/dashboard/community/oversight/branches", label: "Back to branches" } })],
  // Library and the rest of You
  [/^\/dashboard\/library\/teachings$/, () => ({ title: "Teachings Library", back: LIBRARY })],
  [/^\/dashboard\/podcast$/, () => ({ title: "Podcast", back: LIBRARY })],
  [/^\/dashboard\/(prayer-watch|pre-sogp)(\/.*)?$/, m => ({ title: m[1] === "pre-sogp" ? "Pre-SOGP" : "Prayer Watch", back: MY_SOGP })],
  [/^\/dashboard\/podcast\/leaderboard$/, () => ({ title: "Podcast leaderboard", back: { href: "/dashboard/podcast", label: "Back to Podcast" } })],
  [/^\/dashboard\/discipleship-journey\/[^/]+$/, () => ({ title: "Discipleship journey", back: { href: "/dashboard/discipleship-journey", label: "Back to discipleship journey" } })],
  [/^\/dashboard\/welcomepack\/([^/]+)/, m => ({ title: ({ join: "Join", setup: "App and reminders", gifts: "Your gifts", orientation: "Orientation video", audiobook: "Audiobook" } as Record<string, string>)[m[1]] ?? "Welcome Pack", back: { href: "/dashboard/welcomepack", label: "Back to Welcome Pack" } })],
  [/^\/dashboard\/(welcomepack|discipleship-journey)(\/.*)?$/, m => ({
    title: m[1] === "welcomepack" ? "Welcome Pack" : "Discipleship journey",
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

/** Area roots end the walk up the trail. */
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
  let top: string | null = null;
  while (focus && !AREA_ROOTS.has(focus.back.href) && trail.length < 6) {
    trail.unshift({ href: focus.back.href, label: crumbLabel(focus.back) });
    top = focus.back.href;
    focus = dashboardFocusForPath(focus.back.href);
  }
  // A trail that climbs to You or Community, or to one of the You tabs, starts
  // with its area: You › Learning › Your SOGP days. Community trails usually
  // stop at a bottom-bar tab (Groups, Feed, Reports) instead.
  if (focus && AREA_ROOTS.has(focus.back.href)) trail.unshift({ href: focus.back.href, label: focus.back.href === "/dashboard" ? "You" : "Community" });
  else if (!focus && top && (YOU_TABS as readonly string[]).includes(top)) trail.unshift({ href: "/dashboard", label: "You" });
  return trail;
}

/** Each deep screen's true parent; tab roots step back to their area. */
export function dashboardParentForPath(href: string): DashboardParent {
  const focus = dashboardFocusForPath(href);
  if (focus) return focus.back;
  return dashboardAreaForPath(href) === "community" ? COMMUNITY : YOU;
}
