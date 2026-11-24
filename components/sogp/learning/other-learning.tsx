import type { CSSProperties } from "react";

/**
 * The learning-card art family (see DESIGN.md, "Learning cards"): each object
 * on its own field. Other learning itself was retired on 24 November (user);
 * the SOGP page and the learning path chooser still use the art.
 */

export type LearningArt = "welcome" | "pre-sogp" | "sogp" | "advanced" | "podcast" | "library";

/** Field colours sampled from each artwork, so the feathered object meets the card with no seam. */
const FIELDS: Record<LearningArt, { field: string; ink: string }> = {
  welcome: { field: "#d1e7fc", ink: "#123f6e" },
  "pre-sogp": { field: "#f4d2ea", ink: "#5a1e4a" },
  sogp: { field: "#fcd9c7", ink: "#6e2a17" },
  advanced: { field: "#e6dbfb", ink: "#3e1876" },
  podcast: { field: "#d3dfeb", ink: "#1f3a55" },
  library: { field: "#f3e0c4", ink: "#4d3a26" },
};

export const artStyle = (key: LearningArt): CSSProperties => ({
  backgroundColor: FIELDS[key].field, color: FIELDS[key].ink,
  ["--art-1x" as string]: `url("/assets/dashboard/learning-cards/${key}-tile-192.webp")`,
  ["--art-2x" as string]: `url("/assets/dashboard/learning-cards/${key}-tile-384.webp")`,
});
