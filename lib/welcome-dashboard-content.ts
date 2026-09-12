import type { LucideIcon } from "lucide-react";
import {
  BookOpenIcon,
  BrainIcon,
  HeartHandshakeIcon,
  MailIcon,
  PodcastIcon,
  SchoolIcon,
  UsersIcon,
} from "lucide-react";

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
  icon: LucideIcon;
};

export type WelcomeDashboardSectionAccent = "gold" | "blue" | "purple" | "green";

export type WelcomeDashboardSection = {
  id: string;
  title: string;
  accent: WelcomeDashboardSectionAccent;
  cards: WelcomeDashboardCard[];
};

export const welcomeDashboardSections: WelcomeDashboardSection[] = [
  {
    id: "start-here",
    title: "Start Here",
    accent: "gold",
    cards: [
      {
        id: "welcome-pack",
        title: "Welcome Pack",
        description: "Begin with your welcome, orientation, and gifts.",
        href: "/dashboard/welcomepack",
        status: "available",
        icon: MailIcon,
      },
      {
        id: "pre-sogp",
        title: "Pre-SOGP Lessons",
        description: "Prepare daily with teaching and Prayer Watch.",
        href: "/sogp/enrol",
        status: "enrolment_required",
        statusLabel: "Enrolment required",
        icon: BrainIcon,
      },
    ],
  },
  {
    id: "rhythm",
    title: "Your Devotion",
    accent: "blue",
    cards: [
      {
        id: "podcast",
        title: "Podcast",
        description: "Listen to the Pleros Podcast and keep growing in truth.",
        href: "/dashboard/podcast",
        status: "available",
        icon: PodcastIcon,
      },
      {
        id: "devotion",
        title: "Devotion",
        description: "Join Prayer Watch and maintain your daily devotion.",
        href: "/dashboard/prayer-watch",
        status: "available",
        icon: BookOpenIcon,
      },
    ],
  },
  {
    id: "learning",
    title: "Your Training",
    accent: "purple",
    cards: [
      {
        id: "sogp",
        title: "SOGP",
        description: "Your guided journey into truth, growth, and God's purpose.",
        href: "/sogp/enrol",
        status: "enrolment_required",
        statusLabel: "Enrolment required",
        icon: SchoolIcon,
      },
      {
        id: "advanced-sogp",
        title: "Advanced SOGP",
        description: "Continue into advanced formation after SOGP.",
        href: undefined,
        status: "coming_soon",
        statusLabel: "Coming soon",
        icon: SchoolIcon,
      },
    ],
  },
  {
    id: "next-steps",
    title: "Your Commitment",
    accent: "green",
    cards: [
      {
        id: "community",
        title: "Community",
        description: "Your location unit, official updates, and discussion.",
        href: undefined,
        status: "enrolment_required",
        statusLabel: "Enrolment required",
        icon: UsersIcon,
      },
      {
        id: "partnership",
        title: "Partnership",
        description: "Help us reach more people in more nations of the Earth.",
        href: "/partner",
        status: "available",
        icon: HeartHandshakeIcon,
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
      const isJourneyCard =
        card.id === "pre-sogp" ||
        card.id === "sogp" ||
        card.id === "community";
      if (!isSogpEnrolled || !isJourneyCard) return { ...card };

      if (card.id === "pre-sogp") {
        return {
          ...card,
          href: "/dashboard/pre-sogp",
          status: "available" as const,
          statusLabel: undefined,
        };
      }

      if (card.id === "community") {
        return {
          ...card,
          href: "/dashboard/community",
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
