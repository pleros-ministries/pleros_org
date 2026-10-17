import { Be_Vietnam_Pro, Sen } from "next/font/google";

/** Authenticated dashboard face (user decision, 17 October: Be Vietnam Pro
 *  replaces Inter). Tracking tokens live on `.root` in dashboard.module.css. */
export const dashboardFont = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dashboard",
  display: "swap",
});

/** Dashboard h1–h3. Its own variable, because the shell remaps `--font-sen`
 *  to the body face for older feature pages. */
export const dashboardHeadingFont = Sen({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-dashboard-heading",
  display: "swap",
});
