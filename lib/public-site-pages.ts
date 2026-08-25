export type PublicSitePage = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  toneClass: "theme-questions" | "theme-purpose" | "theme-fulfil";
};

export const publicSitePages: PublicSitePage[] = [
  {
    slug: "questions",
    eyebrow: "Questions",
    title: "Explore Questions",
    description:
      "A public landing space for honest Gospel questions, spiritual curiosity, and next steps into deeper discipleship.",
    bullets: [
      "Find thoughtful answers rooted in Scripture.",
      "Make room for doubt, curiosity, and honest conversation.",
      "Move from questions into growth without pressure.",
    ],
    toneClass: "theme-questions",
  },
  {
    slug: "purpose",
    eyebrow: "Purpose",
    title: "Discover Purpose",
    description:
      "A public pathway for people discerning calling, identity, and how God is shaping their life in this season.",
    bullets: [
      "Reflect on identity, direction, and obedience.",
      "Learn through teaching, prayer, and guided next steps.",
      "See how purpose becomes lived discipleship.",
    ],
    toneClass: "theme-purpose",
  },
  {
    slug: "fulfil",
    eyebrow: "Fulfil",
    title: "Fulfil Purpose",
    description:
      "A public overview for people ready to grow in consistency, maturity, and practical obedience to God's call.",
    bullets: [
      "Build rhythms of prayer, the Word, and action.",
      "Translate conviction into sustained spiritual growth.",
      "Keep moving with clarity and accountability.",
    ],
    toneClass: "theme-fulfil",
  },
  {
    slug: "podcast",
    eyebrow: "Podcast",
    title: "Pleros Podcast",
    description:
      "A public listening hub for recent teaching themes, encouragement, and audio-first discipleship content.",
    bullets: [
      "Listen to current teaching threads and encouragement.",
      "Share episodes that help people start or keep growing.",
      "Use podcast content as a doorway into the wider Pleros journey.",
    ],
    toneClass: "theme-questions",
  },
  {
    slug: "library",
    eyebrow: "Library",
    title: "Explore Our Library",
    description:
      "A public shelf for messages and teaching collections across prayer, identity, purpose, and spiritual growth.",
    bullets: [
      "Browse teaching by theme and spiritual need.",
      "Surface foundational content for new and returning visitors.",
      "Create a simple bridge into deeper engagement with Pleros.",
    ],
    toneClass: "theme-purpose",
  },
  {
    slug: "about",
    eyebrow: "About",
    title: "About Pleros",
    description:
      "Learn the heartbeat, spiritual vision, and public ministry direction behind Pleros Ministries & Missions.",
    bullets: [
      "Understand the mission and public expression of Pleros.",
      "See the ministries and pathways that shape the site experience.",
      "Get a simple overview before exploring deeper content.",
    ],
    toneClass: "theme-purpose",
  },
  {
    slug: "partner",
    eyebrow: "Partner",
    title: "Partner with Pleros",
    description:
      "Support the work of teaching, discipleship, prayer, and Gospel clarity by partnering with Pleros.",
    bullets: [
      "See how partnership strengthens public ministry work.",
      "Support teaching, media, and discipleship initiatives.",
      "Join the vision with clarity and intentionality.",
    ],
    toneClass: "theme-questions",
  },
  {
    slug: "contact",
    eyebrow: "Contact",
    title: "Contact Pleros",
    description:
      "Reach out for questions, next steps, ministry enquiries, and other public-facing conversations with the team.",
    bullets: [
      "Use this page for questions and ministry contact points.",
      "Find the right route for enquiries and conversations.",
      "Keep the next step simple and clear.",
    ],
    toneClass: "theme-fulfil",
  },
  {
    slug: "vision-and-mission",
    eyebrow: "Vision and Mission",
    title: "Vision and Mission",
    description:
      "Read the public statement of what Pleros is building, why it exists, and how that mission shapes its ministry pathways.",
    bullets: [
      "See the spiritual vision behind the public site.",
      "Understand how mission translates into practical ministry pathways.",
      "Use this page as the orientation point for the broader work.",
    ],
    toneClass: "theme-purpose",
  },
] as const;

export function getPublicSitePage(slug: string): PublicSitePage | null {
  return publicSitePages.find((page) => page.slug === slug) ?? null;
}
