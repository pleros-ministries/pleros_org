export type WelcomePackGift = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  buttonLabel: string;
  href: string;
};

export const mainGifts: WelcomePackGift[] = [
  {
    id: "purpose-welcome",
    title: "Introduction to God's Purpose",
    description:
      "A focused first step for understanding God's purpose and your growth journey.",
    imageSrc: "/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg",
    buttonLabel: "Open gift",
    href: "/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg",
  },
  {
    id: "gospel-answers",
    title: "The Gospel Answers You",
    description:
      "A simple Gospel resource to help you begin with clarity and confidence.",
    imageSrc: "/site/home/assets/welcome-pack-cards/ga-welcome-card.svg",
    buttonLabel: "Open gift",
    href: "/site/home/assets/welcome-pack-cards/ga-welcome-card.svg",
  },
];

export const extraGifts: WelcomePackGift[] = [
  {
    id: "prayer-rhythm",
    title: "Why have I not changed?",
    description:
      "A practical guide for building steady prayer and Word habits.",
    imageSrc: "/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg",
    buttonLabel: "Open extra gift",
    href: "/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg",
  },
  {
    id: "growth-map",
    title: "Should I be Afraid of Hell?",
    description:
      "A simple map for moving from questions into purpose and discipleship.",
    imageSrc: "/site/home/assets/welcome-pack-cards/ga-welcome-card.svg",
    buttonLabel: "Open extra gift",
    href: "/site/home/assets/welcome-pack-cards/ga-welcome-card.svg",
  },
];
