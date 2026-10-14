import { Inter } from "next/font/google";

/** Authenticated dashboard face. The variable optical-size axis tightens
 *  display sizes; tracking tokens live on `.root` in dashboard.module.css. */
export const dashboardFont = Inter({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  variable: "--font-dashboard",
  display: "swap",
});
