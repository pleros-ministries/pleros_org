import { getSogpCountdown } from "./sogp/calendar";

export type WelcomeDashboardCardStatus =
  | "available"
  | "enrolment_required"
  | "upcoming"
  | "coming_soon";

export type WelcomeDashboardCard = {
  id: string;
  title: string;
  description: string;
  href?: string;
  status: WelcomeDashboardCardStatus;
  statusLabel?: string;
  accent: "orange" | "blue";
  backgroundImageSrc?: string;
  backgroundImagePosition?: string;
  backgroundOverlay?: "text-gradient" | "text-panel" | "none";
};

export type WelcomeDashboardSection = {
  id: string;
  title: string;
  cards: WelcomeDashboardCard[];
};

export const welcomeDashboardSections: WelcomeDashboardSection[] = [
  {
    id: "start-here",
    title: "Start here",
    cards: [
      {
        id: "welcome-pack",
        title: "Welcome Pack",
        description: "Begin with your welcome, orientation, and gifts.",
        href: "/dashboard/welcomepack",
        status: "available",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/1-welcome-pack-bg.webp",
      },
      {
        id: "pre-sogp",
        title: "Pre-SOGP Lessons",
        description: "Prepare daily with teaching and Prayer Watch.",
        href: "/sogp/enrol",
        status: "enrolment_required",
        statusLabel: "Enrolment required",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/pleros-community-background.webp",
        backgroundOverlay: "text-panel",
      },
    ],
  },
  {
    id: "rhythm",
    title: "Your rhythm",
    cards: [
      {
        id: "podcast",
        title: "Podcast",
        description: "Listen to the Pleros Podcast and keep growing in truth.",
        href: "/dashboard/podcast",
        status: "available",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/3-pleros-podcast-v2.webp",
        backgroundImagePosition: "object-[72%_center]",
      },
      {
        id: "devotion",
        title: "Devotion",
        description: "Join Prayer Watch and maintain your daily devotion.",
        href: "/dashboard/prayer-watch",
        status: "available",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/4-prayer-watch-bg.webp",
        backgroundOverlay: "none",
      },
    ],
  },
  {
    id: "learning",
    title: "Your learning",
    cards: [
      {
        id: "sogp",
        title: "SOGP",
        description: "Your guided journey into truth, growth, and God's purpose.",
        href: "/sogp/enrol",
        status: "enrolment_required",
        statusLabel: "Enrolment required",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/6-school-of-purpose-v2.webp",
      },
      {
        id: "advanced-sogp",
        title: "Advanced SOGP",
        description: "Continue into advanced formation after SOGP.",
        href: undefined,
        status: "coming_soon",
        statusLabel: "Coming soon",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/5-PPC-bg.webp",
      },
    ],
  },
  {
    id: "next-steps",
    title: "Your next steps",
    cards: [
      {
        id: "community",
        title: "Community",
        description: "Stay connected with the wider Pleros community.",
        href: undefined,
        status: "coming_soon",
        statusLabel: "Coming soon",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/7-assignment-bg-v2.webp",
      },
      {
        id: "partnership",
        title: "Partnership",
        description: "Help us reach more people in more nations of the Earth.",
        href: "/partner",
        status: "available",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/8-partnership-bg.webp",
      },
    ],
  },
];

export function resolveWelcomeDashboardSections({
  isSogpEnrolled,
  startsAt,
  now = new Date(),
}: {
  isSogpEnrolled: boolean;
  startsAt: Date | null;
  now?: Date;
}) {
  return welcomeDashboardSections.map((section) => ({
    ...section,
    cards: section.cards.map((card) => {
      const isJourneyCard = card.id === "pre-sogp" || card.id === "sogp";
      if (!isSogpEnrolled || !isJourneyCard) return { ...card };

      if (card.id === "pre-sogp") {
        return {
          ...card,
          href: "/dashboard/pre-sogp",
          status: "available" as const,
          statusLabel: undefined,
        };
      }

      const countdown = startsAt ? getSogpCountdown(startsAt, now) : null;
      return {
        ...card,
        href: "/dashboard/sogp",
        status:
          countdown?.phase === "upcoming"
            ? ("upcoming" as const)
            : ("available" as const),
        statusLabel:
          countdown?.phase === "upcoming" ? countdown.label : undefined,
      };
    }),
  }));
}
