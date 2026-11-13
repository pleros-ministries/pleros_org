import { PartnerGiving } from "@/components/dashboard/library/partner-home";
import libraryStyles from "@/components/dashboard/library/library.module.css";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import dashboardStyles from "@/components/dashboard/v3/dashboard.module.css";

/**
 * The public Partner page from giving downward is the dashboard Partner tab
 * itself (user, 13 November: the same design): Give now, Ways to give, Report
 * giving, Why partner with Pleros, What your gift does, in the dashboard's
 * fonts and cards. Report giving links to the tab, which asks visitors to log
 * in first, so this page reads no session.
 */
export function PartnerGivingSections() {
  return <section id="partner" className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${dashboardStyles.root} bg-[var(--color-community-canvas)] py-6 md:py-10`} data-dashboard-v3>
    <div className={libraryStyles.page}>
      <PartnerGiving name="" email="" signedIn={false} />
    </div>
  </section>;
}
