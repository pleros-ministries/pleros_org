export const podcastPlaylistUrl =
  "https://www.youtube.com/watch?v=56wftvHP3vI&list=PLeX3pQHW9Ln6OrlldW4z22pJ6ptUQ-UwQ&pp=0gcJCUUDOCosWNin" as const;

const podcastPlaylistId = "PLeX3pQHW9Ln6OrlldW4z22pJ6ptUQ-UwQ" as const;

function buildPodcastEpisodeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}&list=${podcastPlaylistId}`;
}

export const podcastPageHero = {
  eyebrow: "Podcast",
  title: "Follow the Pleros podcast",
  illustrationSrc: "/assets/home/podcast-poster.png",
} as const;

export const podcastFeaturedSection = {
  eyebrow: "Featured teaching",
  title: "Start with the latest teaching",
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
      "Is this Gospel just about your salvation? Is that all there is to it? That's the core question and tension we seek to address in this first episode.",
    href: buildPodcastEpisodeUrl("S_xHfkCZy3g"),
  },
  {
    id: "reality-of-gods-purpose",
    title: "The Reality of God's Purpose",
    description:
      "In the fifth episode of this series, we answer the most foundational question of all: Why are we here? If we were made for His purpose, then life does not truly begin until we discover what that purpose is exactly.",
    href: buildPodcastEpisodeUrl("dEcREef63Y0"),
  },
  {
    id: "pursuit-of-gods-purpose",
    title: "The Pursuit of God's Purpose",
    description:
      "In our last series, we established that God's purpose of sonship is to be His child and His heir with specific responsibilities he has allotted to you and no one else. In this episode, we introduce our next series, \"The Pursuit of His Purpose,\" where we'll answer the question \"What do I do now?\"",
    href: buildPodcastEpisodeUrl("28Q0bMLZnSg"),
  },
  {
    id: "how-to-fulfill-gods-purpose",
    title: "How to Fulfill God's Purpose",
    description:
      "Your spiritual assignment is a specific allotment given exclusively to you. In this episode, we begin to examine what preparation makes fulfilling our spiritual assignment possible.",
    href: buildPodcastEpisodeUrl("EWXgKv1Eo9Q"),
  },
  {
    id: "mind-of-man",
    title: "The Mind of Man",
    description:
      "The mechanics of how spiritual growth happens has to do with our mind. Our mind is the seat of the activities of growth. In this episode, we begin a new series on the study of the mind of a man.",
    href: buildPodcastEpisodeUrl("cOZq7Uv91r4"),
  },
  {
    id: "faith-stand",
    title: "Faith Stand",
    description:
      "Spiritual growth takes place on the mind of man. It is the increase of the influence of the Spirit on our mind. In this episode we begin to look more closely at the hidden part of our mind, which affects us in taking our faith stand.",
    href: buildPodcastEpisodeUrl("t7sP_X1y3rA"),
  },
  {
    id: "hidden-man",
    title: "The Hidden Man",
    description:
      "Spiritual growth doesn't happen in our Spirit but on our mind. In this episode we begin to study, relative to our spiritual growth, the hidden man in the mind of a man.",
    href: buildPodcastEpisodeUrl("QEnq25n6ybU"),
  },
  {
    id: "developing-the-inner-man",
    title: "Developing the Inner Man",
    description:
      "We have seen at the core that what affects our fulfillment of God's Purpose is the state of our Hidden Man. Join us in this new series where we study how to develop the Hidden Man.",
    href: buildPodcastEpisodeUrl("L4ENdc91y3o"),
  },
  {
    id: "newness-of-life",
    title: "The Newness of Life",
    description:
      "To be in God's Purpose is to have a new nature — His nature. We begin a fresh study: The Newness of Life to gain clarity on all that is found in that nature and how to walk in it.",
    href: buildPodcastEpisodeUrl("e0bh88LL1nM"),
  },
  {
    id: "healing-in-the-newness-of-life",
    title: "Healing in the Newness of Life",
    description:
      "We begin a new study: Healing in the Newness of Life to learn how to walk in health and healing available to the New Creation.",
    href: buildPodcastEpisodeUrl("ji8qta1WzK8"),
  },
  {
    id: "preservation-in-the-newness-of-life",
    title: "Preservation in the Newness of Life",
    description:
      "In this episode, we begin our study on Preservation in the Newness of Life.",
    href: buildPodcastEpisodeUrl("15UQNBv-Kbo"),
  },
  {
    id: "favour-in-the-newness-of-life",
    title: "Favour in the Newness of Life",
    description:
      "In this episode, we begin our study on Favour in the Newness of Life.",
    href: buildPodcastEpisodeUrl("o-uFSxxt1oA"),
  },
] as const;

export const podcastWhyListenItems = [
  {
    title: "Keep the Word in front of you",
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
      "Each episode is meant to leave you with direction, not just inspiration, so you know how to keep moving.",
  },
] as const;

export const podcastJourneySteps = [
  {
    eyebrow: "Questions",
    title: "Start with honest Gospel answers",
    description:
      "If the podcast surfaces deeper questions, begin with the Questions pathway for Scripture-rooted clarity.",
    href: "/questions",
    ctaLabel: "Explore questions",
    tone: "questions",
  },
  {
    eyebrow: "Purpose",
    title: "Move into discovering purpose",
    description:
      "When the truth is landing, follow it into the Purpose pathway and grow in understanding of God's direction for your life.",
    href: "/purpose",
    ctaLabel: "Discover purpose",
    tone: "purpose",
  },
  {
    eyebrow: "Fulfill",
    title: "Keep growing through PPC",
    description:
      "If you are ready for structure, accountability, and sustained formation, PPC is the next step into fulfillment.",
    href: "/fulfill",
    ctaLabel: "Enter PPC",
    tone: "fulfil",
  },
] as const;
