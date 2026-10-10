/** Stable dashboard destinations, mapped only into the isolated preview. Entity
 * details (a teaching, group, thread or report) remain contextual links. */
type SectionKey = "personal" | "devotion" | "training" | "community" | "oversight" | "welcome";
export type DashboardDestination = { key: string; label: string; path: string; actualRoute?: string; params?: Record<string, string> };
function destination(key: string, label: string, actualRoute: string): DashboardDestination {
  return { key, label, actualRoute, path: `destinations/${key}` };
}
export const dashboardNavigation: { key: SectionKey; label: string; items: DashboardDestination[] }[] = [
  { key: "personal", label: "Personal", items: [
    { key: "overview", label: "Overview", path: "", actualRoute: "/dashboard" },
    { key: "reports", label: "Daily reports", path: "reports", actualRoute: "/dashboard/community/report" },
    destination("report-history", "Report history", "/dashboard/community/report/history"),
    destination("partnership", "Partnership", "/partner"),
  ] },
  { key: "devotion", label: "Devotion", items: [
    destination("prayer-watch", "Prayer Watch & Bible reading", "/dashboard/prayer-watch"),
    destination("podcast", "Podcast", "/dashboard/podcast"),
    destination("podcast-leaderboard", "Podcast leaderboard", "/dashboard/podcast/leaderboard"),
  ] },
  { key: "training", label: "Training", items: [
    destination("pre-sogp", "Pre-SOGP", "/dashboard/pre-sogp"),
    { key: "sogp", label: "SOGP", path: "sogp", actualRoute: "/dashboard/sogp" },
    destination("sogp-course", "SOGP course", "/dashboard/sogp/course"),
    destination("sogp-leaderboard", "SOGP leaderboard", "/dashboard/sogp/leaderboard"),
    destination("sogp-certificate", "Certificate", "/dashboard/sogp/certificate"),
    destination("sogp-referrals", "Referrals", "/dashboard/sogp/referrals"),
    destination("discipleship-journey", "Discipleship journey", "/dashboard/discipleship-journey"),
  ] },
  { key: "community", label: "Community", items: [
    destination("feed", "Feed", "/dashboard/community"),
    destination("location-group", "Your location group", "/dashboard/community/unit/[unitId]"),
    destination("groups", "Community groups", "/dashboard/community/groups"),
    destination("messages", "Messages", "/dashboard/community/messages"),
    destination("ask", "Ask Pleros", "/dashboard/community/ask"),
    destination("discipleship-discussions", "Discipleship discussions", "/dashboard/community/discipleship"),
  ] },
  { key: "oversight", label: "Oversight", items: [
    { key: "disciples", label: "My disciples", path: "disciples", actualRoute: "/dashboard/sogp/discipleship" },
    { key: "people", label: "Church oversight", path: "people", actualRoute: "/dashboard/community/leader" },
  ] },
  { key: "welcome", label: "Welcome Pack", items: [
    destination("welcome-pack", "Welcome Pack", "/dashboard/welcomepack"),
    destination("join", "Join the community", "/dashboard/welcomepack/join"),
    destination("orientation", "Orientation", "/dashboard/welcomepack/orientation"),
    destination("gifts", "Your gifts", "/dashboard/welcomepack/gifts"),
    destination("audiobook", "Audiobook", "/dashboard/welcomepack/audiobook"),
    destination("reminders", "App and reminders", "/dashboard/welcomepack/setup"),
    destination("church", "Our church ministry", "/fcc"),
  ] },
];
export const unavailableDestinations = dashboardNavigation.flatMap((section) => section.items).filter((item) => item.path.startsWith("destinations/"));
