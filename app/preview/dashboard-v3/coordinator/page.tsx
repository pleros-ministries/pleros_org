import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { CoordinatorControlCentre, CoordinatorEnrolleeDetails } from "@/components/ppc/sogp-coordinator";

// Reads searchParams on every request (Cache Components).
export const instant = false;

export const metadata = { title: "Coordinator visual preview", robots: { index: false, follow: false } };

/** Labelled sample data. Actions refuse without an admin session. */
export default async function CoordinatorPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const { screen = "centre" } = await searchParams;
  const now = "2026-10-13T14:42:00Z";
  return <div className={`${dashboardFont.className} ${styles.root} px-4`} data-dashboard-v3><p className="py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p>{screen === "details"
    ? <CoordinatorEnrolleeDetails people={[{ id: "n", name: "Nneka Adeyemi", enrolleeCount: 8, region: "Lagos", kind: "enrollee" }, { id: "d", name: "Daniel Okoye", enrolleeCount: 11, region: "Abuja", kind: "pastor" }]} data={{ enrollmentId: 1, name: "Miriam Ibe", cohortTitle: "October cohort", place: "Lagos, Nigeria", joinedAt: "2026-10-12T14:42:00Z", ownerName: "Efe Daniels", ownerId: "e", lastContactedAt: "2026-10-12T15:00:00Z", sourceLabel: "Referral link", referrerName: "Efe Daniels", pendingRequest: null, history: [{ at: "2026-10-12T14:42:00Z", title: "Follow-up assigned", detail: "Referral link" }] }} />
    : <CoordinatorControlCentre rows={[{ enrollmentId: 1, name: "Amara Okafor", cohortTitle: "October cohort", region: "Lagos", createdAt: now, source: "geography", ownerName: "Nneka Adeyemi", ownerId: "n", requested: false }, { enrollmentId: 2, name: "Miriam Ibe", cohortTitle: "October cohort", region: "Lagos", createdAt: now, source: "link", ownerName: "Efe Daniels", ownerId: "e", requested: true }, { enrollmentId: 3, name: "Dayo Eze", cohortTitle: "October cohort", region: "Abuja", createdAt: now, source: "code", ownerName: "Nneka Adeyemi", ownerId: "n", requested: false }]} />}</div>;
}
