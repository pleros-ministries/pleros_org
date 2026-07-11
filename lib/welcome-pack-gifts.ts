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
    title: "Your Pleros Welcome Pack",
    description:
      "Download the book you requested and keep it for offline reading.",
    imageSrc: "/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg",
    buttonLabel: "Download book",
    href: "/api/welcome-pack/download",
  },
];

export const extraGifts: WelcomePackGift[] = [];
