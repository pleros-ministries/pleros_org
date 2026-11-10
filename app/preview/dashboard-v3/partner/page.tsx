import { PartnerHome } from "@/components/dashboard/library/partner-home";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";

export const metadata = { title: "Partner preview", robots: { index: false, follow: false } };

/** The Partner tab with Why partner and Report giving. Nothing sends. */
export default function PartnerPreview() {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-white [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <p className="m-0 px-4 py-2 text-xs text-(--color-text-muted)">Preview · sample data · nothing saved</p>
    <PartnerHome name="Sample Giver" email="giver@example.com" preview />
  </div>;
}
