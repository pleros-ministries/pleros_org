import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { SavedContactsPreview } from "@/components/community/report/ministry-v3/saved-contacts-preview";

export const metadata = { title: "Saved contacts visual preview", robots: { index: false, follow: false } };

export default async function ContactsPreviewPage({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const { screen = "list" } = await searchParams;
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p><SavedContactsPreview screen={screen} /></div>;
}
