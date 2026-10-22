import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import hubStyles from "@/components/sogp/learning/learning-hub.module.css";
import { PendingInvitesMockup } from "@/components/community/groups/pending-invites-mockup";

export const metadata = { title: "Pending invites mockup", robots: { index: false, follow: false } };

/** Mockup of pending invites on a group page. Sample data; nothing saves. */
export default function PendingInvitesPreview() {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Mockup · pending invites · sample data · nothing saved</p>
    <div className={hubStyles.page}><div className={hubStyles.column}><PendingInvitesMockup /></div></div>
  </div>;
}
