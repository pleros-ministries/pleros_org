export type WelcomeDashboardCard = {
  id: string;
  title: string;
  description: string;
  href?: string;
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
    title: "Start Here",
    cards: [
      {
        id: "welcome-pack",
        title: "Your Welcome Pack",
        description:
          "Start with our free ebooks for answers to questions of Purpose and more.",
        href: "/dashboard/welcomepack",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/1-welcome-pack-bg.png",
      },
      {
        id: "prayer-watch-start",
        title: "Join Online Community",
        description:
          "A Word and prayer community to help you walk in God's purpose daily.",
        href: "https://whatsapp.com/channel/0029VbBLp0ZF6smtyjjzf72L",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/pleros-community-background.png",
        backgroundOverlay: "text-panel",
      },
    ],
  },
  {
    id: "devotion",
    title: "Your Devotion",
    cards: [
      {
        id: "podcast",
        title: "The Pleros Podcast",
        description:
          "Your daily dose of God's Word helping you fulfill God's purpose",
        href: "/podcast",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/3-pleros-podcast-v2.png",
        backgroundImagePosition: "object-[72%_center]",
      },
      {
        id: "prayer-watch-devotion",
        title: "Prayer Watch",
        description:
          "Maintain a daily life of devotion by joining our daily times of prayer.",
        href: "/dashboard/prayer-watch",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/4-prayer-watch-bg.png",
        backgroundOverlay: "none",
      },
    ],
  },
  {
    id: "training",
    title: "Your Training",
    cards: [
      {
        id: "perfecting-course",
        title: "Pleros Perfecting Course",
        description: "Doctrinal training for clarity, growth, and ministry.",
        href: "/ppc",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/5-PPC-bg.png",
      },
      {
        id: "school-of-purpose",
        title: "School of God's Purpose",
        description: "A weekly live teaching series to help you fulfill God's purpose.",
        href: "/dashboard/school-of-purpose",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/6-school-of-purpose-v2.png",
      },
    ],
  },
  {
    id: "commitment",
    title: "Your Commitment",
    cards: [
      {
        id: "assignments",
        title: "Assignments",
        description: "Your spiritual assignment dashboard. Coming soon.",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/7-assignment-bg-v2.png",
      },
      {
        id: "partnership",
        title: "Partnership",
        description:
          "Your support will help us reach more men in more nations of the Earth.",
        href: "/partner",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/8-partnership-bg.png",
      },
    ],
  },
];
