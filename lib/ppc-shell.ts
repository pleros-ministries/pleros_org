import type { AppRole } from "./app-role";

export type PpcShellIcon =
  | "dashboard"
  | "admin"
  | "content"
  | "students"
  | "review"
  | "qa"
  | "notifications"
  | "learning";

export type PpcShellNavItem = {
  label: string;
  path: string;
  icon: PpcShellIcon;
  roles: AppRole[];
};

export type PpcShellContext = {
  label: string;
  description: string;
};

export type PpcStudentLevelSource = {
  id: number;
  title: string;
  sortOrder: number;
};

export type PpcStudentLevelNavItem = {
  id: number;
  label: string;
  description: string;
  href: string | null;
  state: "completed" | "current" | "locked";
};

export const PPC_SHELL_NAV_ITEMS: PpcShellNavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: "dashboard",
    roles: ["admin", "instructor"],
  },
  {
    label: "Platform",
    path: "/platform",
    icon: "admin",
    roles: ["admin"],
  },
  {
    label: "Content",
    path: "/content",
    icon: "content",
    roles: ["admin"],
  },
  {
    label: "Students",
    path: "/students",
    icon: "students",
    roles: ["admin", "instructor"],
  },
  {
    label: "Review queue",
    path: "/review",
    icon: "review",
    roles: ["admin", "instructor"],
  },
  {
    label: "Q&A inbox",
    path: "/qa",
    icon: "qa",
    roles: ["admin", "instructor"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: "notifications",
    roles: ["admin", "instructor"],
  },
  {
    label: "My learning",
    path: "/student",
    icon: "learning",
    roles: ["student"],
  },
];

function normalizePath(path: string): string {
  if (!path) {
    return "/";
  }

  const trimmed = path.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

export function getLogicalPpcShellPath(pathname: string): string {
  if (pathname.startsWith("/admin")) {
    const logicalPath = pathname.slice(6);
    return normalizePath(logicalPath || "/");
  }

  if (!pathname.startsWith("/ppc")) {
    return normalizePath(pathname);
  }

  const logicalPath = pathname.slice(4);
  return normalizePath(logicalPath || "/");
}

export function getVisiblePpcShellNavItems(role: AppRole): PpcShellNavItem[] {
  return PPC_SHELL_NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function isPpcShellNavItemActive(
  itemPath: string,
  logicalPathname: string,
): boolean {
  if (itemPath === "/") {
    return logicalPathname === "/";
  }

  return logicalPathname === itemPath || logicalPathname.startsWith(`${itemPath}/`);
}

function getCurrentStudentLevelId(
  levels: PpcStudentLevelSource[],
  graduatedLevelIds: Set<number>,
): number | null {
  if (levels.length === 0) {
    return null;
  }

  if (graduatedLevelIds.size === 0) {
    return levels[0]?.id ?? null;
  }

  const graduatedLevels = levels.filter((level) => graduatedLevelIds.has(level.id));
  if (graduatedLevels.length === 0) {
    return levels[0]?.id ?? null;
  }

  const highestGraduatedSortOrder = Math.max(
    ...graduatedLevels.map((level) => level.sortOrder),
  );

  const nextLevel = levels.find((level) => level.sortOrder === highestGraduatedSortOrder + 1);
  return nextLevel?.id ?? null;
}

function splitStudentLevelTitle(title: string, levelId: number) {
  const normalizedTitle = title.trim();
  const matched = normalizedTitle.match(/^Level\s+\d+\s*[–-]\s*(.+)$/i);

  return {
    label: `Level ${levelId}`,
    description: matched?.[1]?.trim() ?? normalizedTitle,
  };
}

export function buildStudentLevelNavItems(
  levels: PpcStudentLevelSource[],
  graduatedLevelIds: number[],
): PpcStudentLevelNavItem[] {
  const graduatedSet = new Set(graduatedLevelIds);
  const currentLevelId = getCurrentStudentLevelId(levels, graduatedSet);

  return levels
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((level) => {
      const { label, description } = splitStudentLevelTitle(level.title, level.id);
      const isCompleted = graduatedSet.has(level.id);
      const isCurrent = currentLevelId === level.id;
      const state = isCompleted ? "completed" : isCurrent ? "current" : "locked";

      return {
        id: level.id,
        label,
        description,
        href: state === "locked" ? null : `/student/level/${level.id}`,
        state,
      };
    });
}

export function isStudentLevelNavItemActive(
  levelId: number,
  logicalPathname: string,
): boolean {
  const levelPath = `/student/level/${levelId}`;
  return logicalPathname === levelPath || logicalPathname.startsWith(`${levelPath}/`);
}

export function getPpcShellContext(pathname: string): PpcShellContext {
  const logicalPath = getLogicalPpcShellPath(pathname);

  if (/^\/student\/level\/[^/]+\/lesson\/[^/]+\/quiz$/.test(logicalPath)) {
    return {
      label: "Quiz",
      description: "Assessment and attempt history",
    };
  }

  if (/^\/student\/level\/[^/]+\/lesson\/[^/]+\/response$/.test(logicalPath)) {
    return {
      label: "Written response",
      description: "Draft, submit, and review status",
    };
  }

  if (/^\/student\/level\/[^/]+\/lesson\/[^/]+\/qa$/.test(logicalPath)) {
    return {
      label: "Lesson Q&A",
      description: "Questions and staff replies",
    };
  }

  if (/^\/student\/level\/[^/]+\/lesson\/[^/]+$/.test(logicalPath)) {
    return {
      label: "Lesson",
      description: "Audio, notes, and completion tasks",
    };
  }

  if (/^\/student\/level\/[^/]+$/.test(logicalPath)) {
    return {
      label: "Level overview",
      description: "Lesson timeline and completion state",
    };
  }

  if (/^\/students\/[^/]+$/.test(logicalPath)) {
    return {
      label: "Student detail",
      description: "Progress and support history",
    };
  }

  if (logicalPath === "/") {
    return {
      label: "Dashboard",
      description: "Course operations overview",
    };
  }

  if (logicalPath === "/students") {
    return {
      label: "Students",
      description: "Roster and cohort progress",
    };
  }

  if (logicalPath === "/review") {
    return {
      label: "Review queue",
      description: "Written submissions awaiting attention",
    };
  }

  if (logicalPath === "/qa") {
    return {
      label: "Q&A inbox",
      description: "Student threads and staff replies",
    };
  }

  if (logicalPath === "/notifications") {
    return {
      label: "Notifications",
      description: "Reminder policy and delivery channels",
    };
  }

  if (logicalPath === "/content") {
    return {
      label: "Content CMS",
      description: "Lessons, notes, audio, and quizzes",
    };
  }

  if (logicalPath === "/platform") {
    return {
      label: "Platform",
      description: "Overrides, assignments, and platform oversight",
    };
  }

  if (logicalPath === "/student") {
    return {
      label: "My learning",
      description: "Levels, progress, and next steps",
    };
  }

  return {
    label: "PPC platform",
    description: "Course administration and learning",
  };
}
