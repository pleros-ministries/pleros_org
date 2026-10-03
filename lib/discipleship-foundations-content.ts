import type { DiscipleshipJourneyVideoItem } from "./discipleship-journey-content";

const sharedPlayIconSrc =
  "/site/home/assets/questions-pathway/video-circle-icon.webp";

const sharedVideoDescription =
  "Your daily dose of God's Word helping you fulfil God's purpose";

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
    thumbnailSrc: buildDriveThumbnailSrc("1wyg_cPKQCxmLLMmkVEXGjE4fFu0w2Nnb"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1wyg_cPKQCxmLLMmkVEXGjE4fFu0w2Nnb"),
    orientation: "portrait",
  },
  {
    id: "baptism-of-the-holy-ghost",
    title: "Baptism of the Holy Ghost",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1vry4HoSC-9Y7KD5fOazSqbDqW_S5bhL5"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1vry4HoSC-9Y7KD5fOazSqbDqW_S5bhL5"),
    orientation: "portrait",
  },
  {
    id: "healing",
    title: "Healing",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("10NSBE6QDZ8sds28_evwUQop7Xb7HpF5T"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("10NSBE6QDZ8sds28_evwUQop7Xb7HpF5T"),
    orientation: "portrait",
  },
  {
    id: "intro-to-gods-purpose",
    title: "Intro to God's Purpose",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1QYQeYUwJJUDnP7zp6Q-i313vnFY_IDwK"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1QYQeYUwJJUDnP7zp6Q-i313vnFY_IDwK"),
    orientation: "portrait",
  },
  {
    id: "the-new-creation",
    title: "The New Creation",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1c8i_UTaOxaIKWHQ1rn-d09W2K6rr_2bD"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1c8i_UTaOxaIKWHQ1rn-d09W2K6rr_2bD"),
    orientation: "portrait",
  },
  {
    id: "assignment",
    title: "Assignment",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1b2UeMzVr4GSRXWRs29nXS5KbcuMsqOBO"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1b2UeMzVr4GSRXWRs29nXS5KbcuMsqOBO"),
    orientation: "portrait",
  },
  {
    id: "spiritual-growth",
    title: "Spiritual Growth",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1RUZNNjKykiVrTnGXj524AwBSPGPe3_gp"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1RUZNNjKykiVrTnGXj524AwBSPGPe3_gp"),
    orientation: "portrait",
  },
  {
    id: "faithstand",
    title: "Faithstand",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1_ltug7r4ghcmAG5xJJ7K8k1wzWYpg9Ie"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1_ltug7r4ghcmAG5xJJ7K8k1wzWYpg9Ie"),
    orientation: "portrait",
  },
  {
    id: "discipline",
    title: "Discipline",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("11qM44RSrSyw5zmZqCXFpPNpsLKQRXz2p"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("11qM44RSrSyw5zmZqCXFpPNpsLKQRXz2p"),
    orientation: "portrait",
  },
  {
    id: "local-church",
    title: "Local Church",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1r8YrnJMlue-5-WA9pNALBpN7st34GfgT"),
    playIconSrc: sharedPlayIconSrc,
    href: buildDrivePreviewSrc("1r8YrnJMlue-5-WA9pNALBpN7st34GfgT"),
    orientation: "portrait",
  },
];
