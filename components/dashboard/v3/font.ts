import { Inter, Sen } from "next/font/google";

/** Authenticated dashboard face. The variable optical-size axis tightens
 *  display sizes; tracking tokens live on `.root` in dashboard.module.css. */
export const dashboardFont = Inter({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
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
