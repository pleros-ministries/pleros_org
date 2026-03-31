export type HomeNavLink = {
  href: string;
  label: string;
};

export type HomePathwayCard = {
  title: string;
  description: string;
  mobileDescription?: string;
  href: string;
  headerImageSrc?: string;
  wordmarkImageSrc?: string;
  arrowImageSrc: string;
  surfaceClassName: string;
  headerClassName: string;
};

export type HomeSocialLink = {
  href: string;
  label: string;
  iconSrc: string;
};

export const homeNavLinks: HomeNavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/questions", label: "Questions" },
  { href: "/purpose", label: "Discover Purpose" },
  { href: "/ppc", label: "Pleros Perfecting Course" },
  { href: "/partner", label: "Partner" },
  { href: "/library", label: "Library" },
  { href: "/about", label: "About" },
  { href: "/vision-and-mission", label: "Vision and Mission" },
  { href: "/contact", label: "Contact" },
];

export const homePathwayCards: HomePathwayCard[] = [
  {
    title: "Questions",
    description:
      "Begin here if you have questions or doubts about God or the Gospel",
    mobileDescription: "Begin here if you have questions or doubts about God or the Gospel",
    href: "/questions",
    headerImageSrc: "/site/home/assets/question-pathway--card-header.png",
    arrowImageSrc: "/site/home/assets/card-arrows/question-card-arrow.svg",
    surfaceClassName: "bg-[#B40735] text-white",
    headerClassName: "bg-[#FFE4BB]",
  },
  {
    title: "Find Purpose",
    description:
      "Want to find out very clearly and objectively what your purpose is?",
    mobileDescription:
      "Want to find out very clearly what your purpose is?",
    href: "/purpose",
    headerImageSrc: "/site/home/assets/discover-pathway--card-header.png",
    arrowImageSrc: "/site/home/assets/card-arrows/discover-card-arrow.svg",
    surfaceClassName: "bg-[#68369B] text-white",
    headerClassName: "bg-[#E8D1FF]",
  },
  {
    title: "Fulfil Purpose",
    description:
      "Tailored for those who want to grow and be transformed spiritually to fulfill God’s purpose",
    mobileDescription: "Want to grow and be trained to fulfil purpose?",
    href: "/ppc",
    headerImageSrc: "/site/home/assets/fulfil-pathway--card-header.png",
    arrowImageSrc: "/site/home/assets/card-arrows/fulfil-card-arrow.svg",
    surfaceClassName: "bg-[#1A4A4D] text-white",
    headerClassName: "bg-[#DAFFB5]",
  },
  {
    title: "Our Church Ministry",
    description: "Fellowship with us at any our branches nationwide",
    mobileDescription: "Fellowship with us at any our branches nationwide",
    href: "/about",
    wordmarkImageSrc: "/site/home/assets/pleros-wordmark.png",
    arrowImageSrc: "/site/home/assets/card-arrows/church-card-arrow.svg",
    surfaceClassName: "bg-[#3744A5] text-white",
    headerClassName: "bg-[#D9D9D9]",
  },
];

export const footerSocialLinks: HomeSocialLink[] = [
  {
    href: "https://instagram.com/pleros_org",
    label: "Instagram",
    iconSrc: "/site/home/assets/social-media-icons/instagram-icon.svg",
  },
  {
    href: "https://x.com/pleros_org",
    label: "X",
    iconSrc: "/site/home/assets/social-media-icons/x-icon.svg",
  },
  {
    href: "https://tiktok.com/@pleros_org",
    label: "TikTok",
    iconSrc: "/site/home/assets/social-media-icons/tiktok-icon.svg",
  },
  {
    href: "https://whatsapp.com/channel/0029VbBLp0ZF6smtyjjzf72L",
    label: "WhatsApp",
    iconSrc: "/site/home/assets/social-media-icons/whatsapp-icon.svg",
  },
];

export const homePodcastUrl = "https://pod.link/1870111674";
export const homeYoutubeChannelUrl = homePodcastUrl;
export const homeInstagramProfileUrl = "https://instagram.com/pleros_org";
export const homeInstagramEmbedUrls = [
  "https://www.instagram.com/pleros_org/reel/DV8IeiFDD5c/",
  "https://www.instagram.com/pleros_org/reel/DWPAQOmjDtW/",
  "https://www.instagram.com/pleros_org/reel/DWPP8ArDBA4/",
  "https://www.instagram.com/pleros_org/reel/DWOjwWbjOs4/",
  "https://www.instagram.com/pleros_org/reel/DWBG50ADMHa/",
] as const;
export const homeWhatsappChannelUrl =
  "https://whatsapp.com/channel/0029VbBLp0ZF6smtyjjzf72L";
