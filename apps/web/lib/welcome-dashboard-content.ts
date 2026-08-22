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
        backgroundImageSrc: "/site/home/assets/dashboard-cards/1-welcome-pack-bg.webp",
      },
      {
        id: "prayer-watch-start",
        title: "Your Discipleship Journey",
        description: "Start here to begin your journey of growth",
        href: "/dashboard/discipleship-journey",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/pleros-community-background.webp",
        backgroundOverlay: "text-panel",
      },
    ],
  },
  {
    id: "devotion",
    title: "Your Devotion",
    cards: [

      {
        id: "prayer-watch-devotion",
        title: "Prayer Watch & Bible Reading",
        description:
          "Maintain a daily life of devotion by joining our daily times of prayer.",
        href: "/dashboard/prayer-watch",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/4-prayer-watch-bg.webp",
        backgroundOverlay: "none",
      },
      {
        id: "podcast",
        title: "The Pleros Podcast",
        description:
          "Your daily dose of God's Word helping you fulfill God's purpose",
        href: "/dashboard/podcast",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/3-pleros-podcast-v2.webp",
        backgroundImagePosition: "object-[72%_center]",
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
        backgroundImageSrc: "/site/home/assets/dashboard-cards/5-PPC-bg.webp",
      },
      {
        id: "school-of-purpose",
        title: "School of God's Purpose",
        description: "A weekly live teaching series to help you fulfill God's purpose.",
        href: "/dashboard/school-of-purpose",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/6-school-of-purpose-v2.webp",
      },
    ],
  },
  {
    id: "commitment",
    title: "Your Commitment",
    cards: [
      {
        id: "assignments",
        title: "Commitment Reports",
        description: "Your spiritual assignment dashboard. Coming soon.",
        accent: "orange",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/7-assignment-bg-v2.webp",
      },
      {
        id: "partnership",
        title: "Partnership",
        description:
          "Your support will help us reach more men in more nations of the Earth.",
        href: "/partner",
        accent: "blue",
        backgroundImageSrc: "/site/home/assets/dashboard-cards/8-partnership-bg.webp",
      },
    ],
  },
];
