export const WELCOME_PACK_JOIN_VIDEO_SRC =
  "/site/sogp/sogp-welcome-page-20260831.mp4";
export const WELCOME_PACK_JOIN_POSTER_SRC =
  "/site/sogp/sogp-welcome-page-20260831.jpg";

export type WelcomePackHubCard = {
  id: "join" | "orientation" | "gifts";
  title: string;
  description: string;
  href: string;
  imageSrc: string;
};

export function getWelcomePackHubCards(
  basePath = "/dashboard/welcomepack",
): WelcomePackHubCard[] {
  return [
    {
      id: "join",
      title: "Welcome message",
      description: "Begin here, then join the SOGP orientation group.",
      href: `${basePath}/join`,
      imageSrc: "/site/home/assets/dashboard-cards/1-welcome-pack-bg.webp",
    },
    {
      id: "orientation",
      title: "Orientation",
      description: "Understand the journey and what comes next.",
      href: `${basePath}/orientation`,
      imageSrc: "/site/sogp/sogp-welcome-WaXgk9zqi78.jpg",
    },
    {
      id: "gifts",
      title: "Gifts",
      description: "Open your books and other Welcome Pack resources.",
      href: `${basePath}/gifts`,
      imageSrc:
        "/assets/dashboard/welcome-pack-main-gift/ebook-purpose-welcome-card.png",
    },
  ];
}
