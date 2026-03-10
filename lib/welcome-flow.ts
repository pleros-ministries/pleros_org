export type DashboardCard = {
  title: string;
  description: string;
  href: string;
  featured?: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): boolean {
  const normalized = normalizeEmail(value);
  return EMAIL_REGEX.test(normalized);
}

export function buildDashboardHref(value: string): string {
  const normalized = normalizeEmail(value);
  const query = new URLSearchParams({ email: normalized });
  return `/dashboard?${query.toString()}`;
}

export function getGreetingName(email: string | undefined): string {
  const normalized = normalizeEmail(email ?? "");

  if (!normalized) {
    return "Friend";
  }

  const localPart = normalized.split("@")[0] ?? "";
  const [firstChunk] = localPart.split(/[._+-]/);
  const firstName = firstChunk.trim();

  if (!firstName) {
    return "Friend";
  }

  return `${firstName[0]!.toUpperCase()}${firstName.slice(1)}`;
}

export const DASHBOARD_CARDS: DashboardCard[] = [
  {
    title: "Pleros Welcome Pack",
    description:
      "Start with guided resources crafted to help you settle into the Pleros rhythm.",
    href: "#",
    featured: true,
  },
  {
    title: "PPC",
    description: "Explore prayer partner commitments and weekly focus notes.",
    href: "#",
  },
  {
    title: "Partnership",
    description: "Review collaboration opportunities and partnership pathways.",
    href: "#",
  },
  {
    title: "Podcast",
    description: "Listen to the latest Pleros conversations and devotionals.",
    href: "/podcast",
  },
  {
    title: "Prayer Watch",
    description: "Join live moments and keep track of intercession schedules.",
    href: "#",
  },
];
