export const podcastPlaylistUrl =
  "https://www.youtube.com/watch?v=56wftvHP3vI&list=PLeX3pQHW9Ln6OrlldW4z22pJ6ptUQ-UwQ&pp=0gcJCUUDOCosWNin" as const;

const podcastPlaylistId = "PLeX3pQHW9Ln6OrlldW4z22pJ6ptUQ-UwQ" as const;

function buildPodcastEpisodeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}&list=${podcastPlaylistId}`;
}

export const podcastPageHero = {
  eyebrow: "Podcast",
  title: "Pleros Podcast",
  mobileTitleLines: ["Follow the Pleros", "podcast"] as const,
  illustrationSrc: "/assets/home/podcast-poster.webp",
} as const;

export const podcastFeaturedSection = {
  eyebrow: "Featured teaching",
  title: "Your 15-minute dose of transformation, wherever you listen",
  description:
    "Listen to the most recent episode, then move through the podcast sub-series from their starting teachings.",
  fallbackTitle: "Open the Pleros Podcast to hear the latest episode",
  fallbackCtaLabel: "Open featured teaching",
} as const;

export const podcastSubscribeCta = {
  label: "Subscribe on YouTube",
  href: podcastPlaylistUrl,
} as const;

export const podcastSeries = [
  {
    id: "place-of-the-gospel",
    title: "The Place of the Gospel in Your Life",
    description:
      "Is the Gospel only about salvation, or is there more to it?",
    href: buildPodcastEpisodeUrl("S_xHfkCZy3g"),
  },
  {
    id: "reality-of-gods-purpose",
    title: "The Reality of God's Purpose",
    description:
      "Why are we here — and what changes when we discover God's purpose?",
    href: buildPodcastEpisodeUrl("dEcREef63Y0"),
  },
  {
    id: "pursuit-of-gods-purpose",
    title: "The Pursuit of God's Purpose",
    description:
      "What to do next as God's child and heir with a specific assignment.",
    href: buildPodcastEpisodeUrl("28Q0bMLZnSg"),
  },
  {
    id: "how-to-fulfill-gods-purpose",
    title: "How to Fulfill God's Purpose",
    description:
      "What prepares you to fulfill the spiritual assignment given only to you?",
    href: buildPodcastEpisodeUrl("EWXgKv1Eo9Q"),
  },
  {
    id: "mind-of-man",
    title: "The Mind of Man",
    description:
      "How the mind works as the seat of spiritual growth.",
    href: buildPodcastEpisodeUrl("cOZq7Uv91r4"),
  },
  {
    id: "faith-stand",
    title: "Faith Stand",
    description:
      'The ultimate answer to the question "How do I change?"',
    href: buildPodcastEpisodeUrl("t7sP_X1y3rA"),
  },
  {
    id: "hidden-man",
    title: "The Hidden Man",
    description:
      "The hidden man in the mind and its role in spiritual growth.",
    href: buildPodcastEpisodeUrl("QEnq25n6ybU"),
  },
  {
    id: "developing-the-inner-man",
    title: "Developing the Inner Man",
    description:
      "How to develop the hidden man at the center of fulfillment.",
    href: buildPodcastEpisodeUrl("L4ENdc91y3o"),
  },
  {
    id: "newness-of-life",
    title: "The Newness of Life",
    description:
      "God's new nature and how to walk in it.",
    href: buildPodcastEpisodeUrl("e0bh88LL1nM"),
  },
  {
    id: "healing-in-the-newness-of-life",
    title: "Healing in the Newness of Life",
    description:
      "Health and healing available to the New Creation.",
    href: buildPodcastEpisodeUrl("ji8qta1WzK8"),
  },
  {
    id: "preservation-in-the-newness-of-life",
    title: "Preservation in the Newness of Life",
    description:
      "Preservation of life in the New Creation.",
    href: buildPodcastEpisodeUrl("15UQNBv-Kbo"),
  },
  {
    id: "favour-in-the-newness-of-life",
    title: "Favour in the Newness of Life",
    description:
      "Favour available in the Newness of life.",
    href: buildPodcastEpisodeUrl("o-uFSxxt1oA"),
  },
] as const;

export const podcastWhyListenItems = [
  {
    title: "Stay full of the Word",
    description:
      "The podcast gives you a repeatable way to stay close to sound teaching during ordinary moments in the day.",
  },
  {
    title: "Grow without waiting for perfect conditions",
    description:
      "You can listen while commuting, resting, or working, which makes spiritual growth easier to sustain over time.",
  },
  {
    title: "Take the next step with clarity",
    description:
      "Sound teaching from God's Word that helps you see His direction clearly and take your next step in purpose.",
  },
] as const;

export const podcastJourneySteps = [
  {
    eyebrow: "Questions",
    title: "Start with honest Gospel answers",
    description:
      "Seeking answers to the big questions like Is there really God? Is the gospel true?",
    href: "/questions",
    ctaLabel: "Explore questions",
    tone: "questions",
  },
  {
    eyebrow: "Purpose",
    title: "Move into discovering purpose",
    description:
      "Have more questions about God's purpose for your life and how to make sense of existence?",
    href: "/purpose",
    ctaLabel: "Discover purpose",
    tone: "purpose",
  },
  {
    eyebrow: "Fulfill",
    title: "Keep growing through PPC",
    description:
      "If you are ready for structure, accountability, and structured discipleship, PPC helps you take the next step into fulfilling God's purpose.",
    href: "/ppc",
    ctaLabel: "Enter PPC",
    tone: "fulfil",
  },
] as const;
