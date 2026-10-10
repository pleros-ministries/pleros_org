import type { AppRole } from "@/lib/app-role";

/**
 * The dashboard's shared navigation, built from server-derived capabilities.
 * Pure so the server layout can build it and the client shell can render it;
 * every route keeps its own guard, so a hidden link is presentation only.
 */

export type DashboardCapabilities = {
  /** Holds a SOGP enrolment (`getSogpDashboardAccess`). */
  sogpEnrolled: boolean;
  /** `canAccessCommunity(getCommunityContext())`. */
  community: boolean;
  /** The viewer's own location group, when they have one. */
  communityUnitId: number | null;
  /** Discipleship discussions belong to enrolled learners (`ctx.enrollmentId`). */
  discipleshipDiscussions: boolean;
  /** `managesAnyUnit(ctx)`: assigned pastor, member leader or admin. */
  managesLocationGroups: boolean;
  /** Any non-student role; `/admin` turns students away itself. */
  staffConsole: boolean;
};

export type DashboardNavSectionKey =
  | "personal"
  | "devotion"
  | "training"
  | "community"
  | "oversight"
  | "welcome";

export type DashboardNavBadge = "messages" | "questions";

export type DashboardNavItem = {
  key: string;
  label: string;
  href: string;
  /** Only the exact path counts as this item. */
  exact?: boolean;
  badge?: DashboardNavBadge;
};

export type DashboardNavSection = {
  key: DashboardNavSectionKey;
  label: string;
  items: DashboardNavItem[];
};

export function buildDashboardNavigation(
  caps: DashboardCapabilities,
): DashboardNavSection[] {
  const personal: DashboardNavItem[] = [
    { key: "overview", label: "Overview", href: "/dashboard", exact: true },
  ];
  if (caps.community) {
    personal.push(
      { key: "report", label: "Daily report", href: "/dashboard/community/report" },
      {
        key: "report-history",
        label: "Report history",
        href: "/dashboard/community/report/history",
      },
    );
  }

  const devotion: DashboardNavItem[] = [
    { key: "prayer-watch", label: "Prayer Watch", href: "/dashboard/prayer-watch" },
    { key: "podcast", label: "Podcast", href: "/dashboard/podcast" },
    {
      key: "podcast-leaderboard",
      label: "Podcast leaderboard",
      href: "/dashboard/podcast/leaderboard",
    },
  ];

  const training: DashboardNavItem[] = caps.sogpEnrolled
    ? [
        { key: "pre-sogp", label: "Pre-SOGP", href: "/dashboard/pre-sogp" },
        { key: "sogp", label: "SOGP", href: "/dashboard/sogp" },
        { key: "sogp-course", label: "SOGP course", href: "/dashboard/sogp/course" },
        {
          key: "sogp-leaderboard",
          label: "SOGP leaderboard",
          href: "/dashboard/sogp/leaderboard",
        },
        { key: "sogp-certificate", label: "Certificate", href: "/dashboard/sogp/certificate" },
        { key: "sogp-referrals", label: "Referrals", href: "/dashboard/sogp/referrals" },
      ]
    : [{ key: "sogp-enrol", label: "Enrol in SOGP", href: "/sogp/enrol" }];
  training.push({
    key: "discipleship-journey",
    label: "Discipleship journey",
    href: "/dashboard/discipleship-journey",
  });

  const community: DashboardNavItem[] = [];
  if (caps.community) {
    community.push({ key: "feed", label: "Feed", href: "/dashboard/community" });
    if (caps.communityUnitId != null) {
      community.push({
        key: "location-group",
        label: "Your location group",
        href: `/dashboard/community/unit/${caps.communityUnitId}`,
      });
    }
    community.push(
      { key: "groups", label: "Groups", href: "/dashboard/community/groups" },
      {
        key: "messages",
        label: "Messages",
        href: "/dashboard/community/messages",
        badge: "messages",
      },
      {
        key: "ask",
        label: "Ask Pleros",
        href: "/dashboard/community/ask",
        badge: "questions",
      },
    );
    if (caps.discipleshipDiscussions) {
      community.push({
        key: "discipleship-discussions",
        label: "Discipleship discussions",
        href: "/dashboard/community/discipleship",
      });
    }
  }

  const oversight: DashboardNavItem[] = [];
  if (caps.sogpEnrolled) {
    oversight.push({
      key: "disciples",
      label: "My disciples",
      href: "/dashboard/sogp/discipleship",
    });
  }
  if (caps.community && caps.managesLocationGroups) {
    oversight.push({
      key: "leader",
      label: "Leader tools",
      href: "/dashboard/community/leader",
    });
  }
  if (caps.staffConsole) {
    oversight.push({ key: "admin", label: "Admin console", href: "/admin" });
  }

  const welcome: DashboardNavItem[] = [
    { key: "welcome-pack", label: "Welcome Pack", href: "/dashboard/welcomepack", exact: true },
    { key: "join", label: "Join the community", href: "/dashboard/welcomepack/join" },
    { key: "orientation", label: "Orientation", href: "/dashboard/welcomepack/orientation" },
    { key: "gifts", label: "Your gifts", href: "/dashboard/welcomepack/gifts" },
    { key: "audiobook", label: "Audiobook", href: "/dashboard/welcomepack/audiobook" },
    { key: "setup", label: "App and reminders", href: "/dashboard/welcomepack/setup" },
  ];

  const sections: DashboardNavSection[] = [
    { key: "personal", label: "Personal", items: personal },
    { key: "devotion", label: "Devotion", items: devotion },
    { key: "training", label: "Training", items: training },
    { key: "community", label: "Community", items: community },
    { key: "oversight", label: "Oversight", items: oversight },
    { key: "welcome", label: "Welcome Pack", items: welcome },
  ];
  return sections.filter((section) => section.items.length > 0);
}

function matches(pathname: string, item: DashboardNavItem): boolean {
  if (pathname === item.href) return true;
  return !item.exact && pathname.startsWith(`${item.href}/`);
}

/** The most specific item for the path, so `/dashboard/sogp/course` is not also "SOGP". */
export function findActiveNavItem(
  sections: DashboardNavSection[],
  pathname: string,
): { sectionKey: DashboardNavSectionKey; itemKey: string } | null {
  let best: { sectionKey: DashboardNavSectionKey; itemKey: string; length: number } | null =
    null;
  for (const section of sections) {
    for (const item of section.items) {
      if (matches(pathname, item) && (!best || item.href.length > best.length)) {
        best = { sectionKey: section.key, itemKey: item.key, length: item.href.length };
      }
    }
  }
  return best ? { sectionKey: best.sectionKey, itemKey: best.itemKey } : null;
}

/**
 * The viewer's current role in plain words. Only existing app roles and
 * relationships count; church assignments have no backend yet.
 */
export function dashboardRoleLabel({
  role,
  sogpEnrolled,
  isUnitLeader,
  managedUnitCount,
}: {
  role: AppRole;
  sogpEnrolled: boolean;
  isUnitLeader: boolean;
  managedUnitCount: number;
}): string {
  const parts: string[] = [];
  switch (role) {
    case "super_admin":
      parts.push("Super admin");
      break;
    case "admin":
      parts.push("Admin");
      break;
    case "instructor":
      parts.push("Instructor");
      break;
    case "pastor":
      parts.push(
        managedUnitCount > 0
          ? `Pastor · ${managedUnitCount} location ${managedUnitCount === 1 ? "group" : "groups"}`
          : "Pastor",
      );
      break;
    default:
      parts.push(sogpEnrolled ? "SOGP learner" : "Member");
  }
  if (isUnitLeader) parts.push("Group leader");
  return parts.join(" · ");
}
