const PPC_HOST = "ppc.pleros.org";

const EXCLUDED_PREFIXES = ["/_next", "/api", "/ppc"];

const EXCLUDED_EXACT_PATHS = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
];

function normalizeHost(host: string | null): string {
  if (!host) {
    return "";
  }

  return host.trim().toLowerCase();
}

function stripPort(host: string): string {
  const separatorIndex = host.indexOf(":");

  if (separatorIndex === -1) {
    return host;
  }

  return host.slice(0, separatorIndex);
}

function isStaticAssetPath(pathname: string): boolean {
  const lastSegment = pathname.split("/").pop();

  if (!lastSegment) {
    return false;
  }

  return /\.[a-z0-9]+$/i.test(lastSegment);
}

export function isPpcHost(host: string | null): boolean {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost) {
    return false;
  }

  return stripPort(normalizedHost) === PPC_HOST;
}

export function getPpcRewritePath(
  host: string | null,
  pathname: string,
): string | null {
  if (!isPpcHost(host)) {
    return null;
  }

  if (EXCLUDED_EXACT_PATHS.includes(pathname)) {
    return null;
  }

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  if (isStaticAssetPath(pathname)) {
    return null;
  }

  if (pathname === "/") {
    return "/ppc";
  }

  return `/ppc${pathname}`;
}
