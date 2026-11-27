import styles from "@/app/fonts/fonts.module.css";

/**
 * Sen and Be Vietnam Pro, self-hosted (27 November): next/font/google fetched
 * them from Google at build time, and a failed fetch failed the build. Same
 * shape as a next/font result, so every `font.variable` / `font.className`
 * keeps working. The faces are declared in app/fonts/self-hosted.css.
 */
type Font = { className: string; variable: string; style: { fontFamily: string; fontStyle: "normal" } };

const font = (className: string, variable: string, family: string): Font =>
  ({ className, variable, style: { fontFamily: `'${family}', '${family} Fallback'`, fontStyle: "normal" } });

export const sen = font(styles.dashboardHeadingFace!, styles.sen!, "Sen");
export const beVietnamPro = font(styles.dashboardFace!, styles.beVietnamPro!, "Be Vietnam Pro");
/** Authenticated dashboard face (user decision, 17 October: Be Vietnam Pro replaces Inter). */
export const dashboardFont = font(styles.dashboardFace!, styles.dashboard!, "Be Vietnam Pro");
/** Dashboard h1–h3. Its own variable, because the shell remaps `--font-sen` to the body face for older feature pages. */
export const dashboardHeadingFont = font(styles.dashboardHeadingFace!, styles.dashboardHeading!, "Sen");
