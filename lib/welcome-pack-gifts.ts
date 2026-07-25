export type WelcomePackGift = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  buttonLabel: string;
  href: string;
  locked?: boolean;
};

export const mainGifts: WelcomePackGift[] = [
  {
    id: "purpose-welcome",
    title: "Your Pleros Welcome Pack",
    description:
      "Download the book you requested and keep it for offline reading.",
    imageSrc: "/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg",
    buttonLabel: "Download book",
    href: "/api/welcome-pack/download",
  },
  {
    id: "purpose-welcome-audio",
    title: "Audio Version (45 min)",
    description:
      "Listen to the full welcome pack teaching in audio format.",
    imageSrc: "/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg",
    buttonLabel: "Coming soon",
    href: "#",
    locked: true,
  },
];

export const extraGifts: WelcomePackGift[] = [
  {
    id: "breaking-habits-and-addictions",
    title: "Breaking Habits and Addictions as a New Creation",
    description:
      "A transformative teaching to help you walk free in Christ.",
    imageSrc: "/assets/dashboard/free-gift-book-covers/book-card-habits-addictions.png",
    buttonLabel: "Coming soon",
    href: "#",
  },
  {
    id: "gospel-proves-itself-true",
    title: "How the Gospel Proves Itself to Be the Truth",
    description: "A clear case for the truth and power of the Gospel.",
    imageSrc: "/assets/dashboard/free-gift-book-covers/book-card-gospel-prove-truth.png",
    buttonLabel: "Coming soon",
    href: "#",
  },
];
