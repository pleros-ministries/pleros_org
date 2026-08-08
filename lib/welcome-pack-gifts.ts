export type WelcomePackGift = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageBackgroundColor?: string;
  buttonLabel: string;
  href: string;
  locked?: boolean;
};

export const mainGifts: WelcomePackGift[] = [
  {
    id: "purpose-welcome",
    title: "Welcome to Purpose (ebook)",
    description: "Download for offline reading.",
    imageSrc: "/assets/dashboard/welcome-pack-main-gift/ebook-purpose-welcome-card.png",
    imageBackgroundColor: "#016dd5",
    buttonLabel: "Download book",
    href: "/api/welcome-pack/download",
  },
  {
    id: "purpose-welcome-audio",
    title: "Welcome to Purpose (Audiobook)",
    description: "Listen to the book in audio format.",
    imageSrc: "/assets/dashboard/welcome-pack-main-gift/audiobook-purpose-welcome-card.png",
    imageBackgroundColor: "#016dd5",
    buttonLabel: "Listen now",
    href: "/dashboard/welcomepack/audiobook",
  },
];

export const extraGifts: WelcomePackGift[] = [
  {
    id: "breaking-habits-and-addictions",
    title: "Breaking Habits and Addictions as a New Creation",
    description:
      "A transformative teaching to help you walk free of the flesh.",
    imageSrc: "/assets/dashboard/free-gift-book-covers/book-card-habits-addictions.png",
    imageBackgroundColor: "#4654dc",
    buttonLabel: "Coming soon",
    href: "#",
  },
  {
    id: "gospel-proves-itself-true",
    title: "How the Gospel Proves Itself to Be the Truth",
    description:
      "A clear case for the gospel's claim as the truth of existence.",
    imageSrc: "/assets/dashboard/free-gift-book-covers/book-card-gospel-prove-truth.png",
    imageBackgroundColor: "#fffed8",
    buttonLabel: "Coming soon",
    href: "#",
  },
];
