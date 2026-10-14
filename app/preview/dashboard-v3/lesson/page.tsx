import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { SogpLessonPreview } from "@/components/sogp/sogp-lesson-preview";

export const metadata = { title: "Lesson visual preview", robots: { index: false, follow: false } };
export default function LessonPreview() {
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p><SogpLessonPreview /></div>;
}
