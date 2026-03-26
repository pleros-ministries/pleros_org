function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}

export function resolvePpcHref(currentPathname: string, targetPath: string): string {
  const normalizedTarget = normalizePath(targetPath);

  if (currentPathname.startsWith("/admin")) {
    if (normalizedTarget === "/") {
      return "/admin";
    }

    return `/admin${normalizedTarget}`;
  }

  if (!currentPathname.startsWith("/ppc")) {
    return normalizedTarget;
  }

  if (normalizedTarget === "/") {
    return "/ppc";
  }

  return `/ppc${normalizedTarget}`;
}
