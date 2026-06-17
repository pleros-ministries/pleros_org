export type HomeNavLink = {
  href: string;
  label: string;
  desktopLabel?: string;
};

export type HomeNavGroup = {
  label: string;
  links: HomeNavLink[];
};

export type HomePathwayCard = {
  title: string;
  description: string;
  mobileDescription?: string;
  href: string;
  headerPrompt?: string;
  headerPromptHighlightClassName?: string;
  headerImageSrc?: string;
  headerImageClassName?: string;
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

export type HomeInstagramReel = {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  profileImageUrl: string | null;
  takenAt: number;
};

export const homeNavLinks: HomeNavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/podcast", label: "Pleros Podcast", desktopLabel: "Podcast" },
  { href: "/questions", label: "Questions" },
  { href: "/purpose", label: "Discover Purpose", desktopLabel: "Purpose" },
  { href: "/ppc", label: "Pleros Perfecting Course", desktopLabel: "PPC" },
  { href: "/partner", label: "Partner" },
  { href: "/library", label: "Teachings Library", desktopLabel: "Library" },
  { href: "/about", label: "About Pleros" },
  {
    href: "/vision-and-mission",
    label: "Vision and Mission",
    desktopLabel: "Vision",
  },
  { href: "/contact", label: "Contact" },
];

export const homeDesktopNavStandaloneLinks: HomeNavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
];

export const homeDesktopNavGroups: HomeNavGroup[] = [
  {
    label: "Pathways",
    links: [
      { href: "/questions", label: "Questions" },
      { href: "/purpose", label: "Discover Purpose", desktopLabel: "Purpose" },
      {
        href: "/ppc",
        label: "Pleros Perfecting Course",
        desktopLabel: "PPC",
      },
    ],
  },
  {
    label: "Resources",
    links: [
      { href: "/podcast", label: "Pleros Podcast", desktopLabel: "Podcast" },
      { href: "/partner", label: "Partner" },
      { href: "/library", label: "Teachings Library", desktopLabel: "Library" },
    ],
  },
  {
    label: "About",
    links: [
      {
        href: "/vision-and-mission",
        label: "Vision and Mission",
        desktopLabel: "Vision",
      },
      { href: "/contact", label: "Contact" },
      { href: "/about", label: "About Pleros", desktopLabel: "About us" },
    ],
  },
];

export const homeFooterNavGroups: HomeNavGroup[] = homeDesktopNavGroups.map(
  (group) =>
    group.label === "Pathways"
      ? {
          ...group,
          links: [
            { href: "/dashboard", label: "Your Dashboard" },
            ...group.links.map((link) =>
              link.href === "/questions"
                ? { ...link, label: "Find Answers" }
                : link,
            ),
          ],
        }
      : group,
);

export const homePathwayCards: HomePathwayCard[] = [
  {
    title: "Questions",
    description:
      "If you have questions or doubts about God or the Gospel",
    mobileDescription: "If you have questions or doubts about God or the Gospel",
    href: "/questions",
    headerImageSrc: "/site/home/assets/pathway-card-headers/questions-thumbnail.png",
    headerImageClassName: "object-cover object-center",
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
    headerImageSrc: "/site/home/assets/pathway-card-headers/purpose-thumbnail.png",
    headerImageClassName: "object-cover object-center",
    arrowImageSrc: "/site/home/assets/card-arrows/discover-card-arrow.svg",
    surfaceClassName: "bg-[#B45309] text-white",
    headerClassName: "bg-[#FFE9BF]",
  },
  {
    title: "Fulfill Purpose",
    description:
      "Tailored for those who want to grow and be transformed spiritually to fulfill God’s purpose",
    mobileDescription: "Want to grow and be trained to fulfill purpose?",
    href: "/fulfill",
    headerImageSrc: "/site/home/assets/pathway-card-headers/fulfill-thumbnail.png",
    headerImageClassName: "object-cover object-center",
    arrowImageSrc: "/site/home/assets/card-arrows/fulfil-card-arrow.svg",
    surfaceClassName: "bg-[#1A4A4D] text-white",
    headerClassName: "bg-[#DAFFB5]",
  },
  {
    title: "Our Church Ministry",
    description: "Fellowship with us at any our branches nationwide",
    mobileDescription: "Fellowship with us at any our branches nationwide",
    href: "/about",
    headerImageSrc: "/site/home/assets/church-pathway/church-logo-card.png",
    headerImageClassName: "object-cover object-center",
    arrowImageSrc: "/site/home/assets/card-arrows/church-card-arrow.svg",
    surfaceClassName: "bg-[#3744A5] text-white",
    headerClassName: "bg-[#15349B]",
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
export const homeInstagramReels: HomeInstagramReel[] = [
  {
    id: "3864819336682960006",
    title:
      "Our spiritual growth as believers is very important because that's how we fulfill God...",
    href: "https://www.instagram.com/reel/DWimLXEDHSG/",
    imageUrl:
      "https://instagram.fiba2-2.fna.fbcdn.net/v/t51.71878-15/656824516_1478971880598829_7034558870681660349_n.jpg?stp=c0.249.640.640a_dst-jpg_e15_tt6&_nc_ht=instagram.fiba2-2.fna.fbcdn.net&_nc_cat=101&_nc_sid=8b3546",
    profileImageUrl: null,
    takenAt: 1774942566,
  },
  {
    id: "3864779098459796839",
    title:
      "Welcome to Episode 92 of the Pleros Podcast! We continue our study on The Newness of...",
    href: "https://www.instagram.com/reel/DWidB0TDPVn/",
    imageUrl:
      "https://instagram.fiba2-3.fna.fbcdn.net/v/t51.71878-15/657662153_1887912575192454_1320796026549632909_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=instagram.fiba2-3.fna.fbcdn.net&_nc_cat=106&_nc_sid=8b3546",
    profileImageUrl: null,
    takenAt: 1774937604,
  },
  {
    id: "3864370578467858966",
    title:
      "We are discussing Gospel Answers Nominal Christianity. What is Nominal Christianity?...",
    href: "https://www.instagram.com/reel/DWhAJEaDCoW/",
    imageUrl:
      "https://instagram.fiba2-3.fna.fbcdn.net/v/t51.71878-15/657340330_1668439484490063_3400575312744568395_n.jpg?stp=c0.249.640.640a_dst-jpg_e15_tt6&_nc_ht=instagram.fiba2-3.fna.fbcdn.net&_nc_cat=103&_nc_sid=8b3546",
    profileImageUrl: null,
    takenAt: 1774889048,
  },
  {
    id: "3864106288292842711",
    title:
      "By faith, we're saved, and by faith we grow. There's a distinction between faith at s...",
    href: "https://www.instagram.com/reel/DWgEDJADEzX/",
    imageUrl:
      "https://instagram.fiba2-3.fna.fbcdn.net/v/t51.71878-15/658378256_1641081483444488_2558696469704588022_n.jpg?stp=c0.249.640.640a_dst-jpg_e15_tt6&_nc_ht=instagram.fiba2-3.fna.fbcdn.net&_nc_cat=108&_nc_sid=8b3546",
    profileImageUrl: null,
    takenAt: 1774857682,
  },
  {
    id: "3864063738026665278",
    title:
      "Welcome to Episode 91 of the Pleros Podcast! To be in God's Purpose is to have a new...",
    href: "https://www.instagram.com/reel/DWf6X8-jCU-/",
    imageUrl:
      "https://instagram.fiba2-3.fna.fbcdn.net/v/t51.71878-15/658778650_932374646323847_5304357245724573247_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=instagram.fiba2-3.fna.fbcdn.net&_nc_cat=111&_nc_sid=8b3546",
    profileImageUrl: null,
    takenAt: 1774852325,
  },
];
export const homeWhatsappChannelUrl =
  "https://whatsapp.com/channel/0029VbBLp0ZF6smtyjjzf72L";
