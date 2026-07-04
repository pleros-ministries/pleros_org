export type WelcomeDashboardCard = {
  id: string;
  title: string;
  description: string;
  href?: string;
  accent: "orange" | "blue";
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
          "Your daily dose of God's Word helping you fulfill God's purpose",
        href: "/dashboard/welcomepack",
        accent: "orange",
      },
      {
        id: "prayer-watch-start",
        title: "Join Online Community",
        description: "Join other accountable believers online to pray daily.",
        href: "https://whatsapp.com/channel/0029VbBLp0ZF6smtyjjzf72L",
        accent: "blue",
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
      },
      {
        id: "prayer-watch-devotion",
        title: "Prayer Watch",
        description: "Log your attendance and catch up on any watch you missed.",
        href: "/dashboard/prayer-watch",
        accent: "blue",
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
        description:
          "Your daily dose of God's Word helping you fulfill God's purpose",
        href: "/ppc",
        accent: "orange",
      },
      {
        id: "school-of-purpose",
        title: "School of God's Purpose",
        description:
          "Be trained to walk in and fulfill God's purpose for your life.",
        accent: "blue",
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
        description:
          "Your daily dose of God's Word helping you fulfill God's purpose",
        accent: "orange",
      },
      {
        id: "partnership",
        title: "Partnership",
        description:
          "Be trained to walk in and fulfill God's purpose for your life.",
        accent: "blue",
      },
    ],
  },
];
