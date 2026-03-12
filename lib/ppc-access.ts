import type { AppRole } from "./app-role";
import { getRoleDefaultPath } from "./app-access";
import { isPpcHost } from "./ppc-routing";

const ADMIN_PATH_PREFIXES = [
  "/",
  "/admin",
  "/students",
  "/review",
  "/qa",
  "/notifications",
  "/student",
];

const INSTRUCTOR_PATH_PREFIXES = ["/", "/students", "/review", "/qa", "/notifications"];

const STUDENT_PATH_PREFIXES = ["/student"];

function normalizeLogicalPath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => {
    if (prefix === "/") {
      return pathname === "/";
    }

    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

export function isPublicPpcPath(path: string): boolean {
  const pathname = normalizeLogicalPath(path);

  return pathname === "/sign-in" || pathname === "/forbidden";
}

export function getRoleHomePath(role: AppRole): string {
  return getRoleDefaultPath(role);
}

export function canAccessPpcPath(role: AppRole, path: string): boolean {
  const pathname = normalizeLogicalPath(path);

  if (isPublicPpcPath(pathname)) {
    return true;
  }

  if (role === "admin") {
    return matchesPrefix(pathname, ADMIN_PATH_PREFIXES);
  }

  if (role === "instructor") {
    return matchesPrefix(pathname, INSTRUCTOR_PATH_PREFIXES);
  }

  return matchesPrefix(pathname, STUDENT_PATH_PREFIXES);
}

export function toExternalPpcPath(host: string | null, logicalPath: string): string {
  const normalizedPath = normalizeLogicalPath(logicalPath);

  if (isPpcHost(host)) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return "/ppc";
  }

  return `/ppc${normalizedPath}`;
}

export function getLogicalPpcPath(host: string | null, pathname: string): string | null {
  if (isPpcHost(host)) {
    if (pathname.startsWith("/ppc")) {
      const strippedPath = pathname.slice(4);
      return strippedPath.length === 0 ? "/" : normalizeLogicalPath(strippedPath);
    }

    return normalizeLogicalPath(pathname);
  }

  if (!pathname.startsWith("/ppc")) {
    return null;
  }

  const strippedPath = pathname.slice(4);

  if (strippedPath.length === 0) {
    return "/";
  }

  return normalizeLogicalPath(strippedPath);
}
