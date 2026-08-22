import type { DiscipleshipJourneyVideoItem } from "./discipleship-journey-content";

const sharedPlayIconSrc =
  "/site/home/assets/questions-pathway/video-circle-icon.webp";

const sharedVideoDescription =
  "Your daily dose of God's Word helping you fulfill God's purpose";

function buildDriveThumbnailSrc(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
}

function buildDrivePreviewSrc(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export const discipleshipFoundationsVideos: DiscipleshipJourneyVideoItem[] = [
  {
    id: "salvation",
    title: "Salvation",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("111KUfwXwvnuOcK1X-IKlU7MH3e8Fn07n"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("111KUfwXwvnuOcK1X-IKlU7MH3e8Fn07n"),
    orientation: "portrait",
  },
  {
    id: "baptism-of-the-holy-ghost",
    title: "Baptism of the Holy Ghost",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1XEOgPsRM6MKw-Y_bSr4-Gbpf0L7a5Tdj"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1XEOgPsRM6MKw-Y_bSr4-Gbpf0L7a5Tdj"),
    orientation: "portrait",
  },
  {
    id: "healing",
    title: "Healing",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("19ynmE35WON1dp3x9sCR5P2-Cr0vpMC2s"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("19ynmE35WON1dp3x9sCR5P2-Cr0vpMC2s"),
    orientation: "portrait",
  },
  {
    id: "intro-to-gods-purpose",
    title: "Intro to God's Purpose",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("13WMTyA5pv3eLbZdrnAoPGKH0BsB-09BR"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("13WMTyA5pv3eLbZdrnAoPGKH0BsB-09BR"),
    orientation: "portrait",
  },
  {
    id: "the-new-creation",
    title: "The New Creation",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1q8XuZKXVhwrLWmhns79knSLkJQDq_xQ7"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1q8XuZKXVhwrLWmhns79knSLkJQDq_xQ7"),
    orientation: "portrait",
  },
  {
    id: "assignment",
    title: "Assignment",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1vVwJIUfJMmqDiVpAh3ivh-m21Tp4ZDLc"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1vVwJIUfJMmqDiVpAh3ivh-m21Tp4ZDLc"),
    orientation: "portrait",
  },
  {
    id: "spiritual-growth",
    title: "Spiritual Growth",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1-64EUUV1A5wOcO_cg9JjUkP7k0Hzr8rb"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1-64EUUV1A5wOcO_cg9JjUkP7k0Hzr8rb"),
    orientation: "portrait",
  },
  {
    id: "faithstand",
    title: "Faithstand",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1DT8iz1uCFA6flcvMoXcKJ2wnuQmpnbTH"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1DT8iz1uCFA6flcvMoXcKJ2wnuQmpnbTH"),
    orientation: "portrait",
  },
  {
    id: "discipline",
    title: "Discipline",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1Q028vRbZf8yj5qlE-xKVhWho9TdQehwb"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1Q028vRbZf8yj5qlE-xKVhWho9TdQehwb"),
    orientation: "portrait",
  },
  {
    id: "local-church",
    title: "Local Church",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1Wm0i8WZLoZaYlhSYDQRzNzxbMaghv7zz"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1Wm0i8WZLoZaYlhSYDQRzNzxbMaghv7zz"),
    orientation: "portrait",
  },
];
