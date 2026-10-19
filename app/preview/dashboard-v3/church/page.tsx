import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { ChurchStructureView } from "@/components/dashboard/church/church-home";
import { ChurchOversight } from "@/components/dashboard/church/church-oversight";
import { AppointBranchPastor, CreatePlace } from "@/components/dashboard/church/church-flows";
import type { ChurchPlace } from "@/lib/db/queries/church-home";

export const metadata = { title: "Church visual preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

// Units are retired under groups as oversight, so branches carry none.
const lagos = { id: 1, name: "Lagos", pastors: [{ userId: "bp", name: "Bayo Adeyemi" }], units: [], workerCount: 0, leaderlessUnits: 0 };
const ibadan = { id: 2, name: "Ibadan", pastors: [], units: [], workerCount: 0, leaderlessUnits: 0 };
const place: ChurchPlace = { viewerRole: "pastor", viewerId: "p", branch: { id: 2, name: "Ibadan" }, pastors: [], unit: null };

/** Labelled sample data. Flow buttons call live actions, which refuse without a session. */
export default async function ChurchPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const { screen = "structure" } = await searchParams;
  const body = screen === "oversight" ? <ChurchOversight day="2026-10-13" dayLabel="Tue 13 Oct" scope="Tolu’s groups" remindersEnabled rows={[{ userId: "a", name: "Dayo Eze", roleLabel: "Member", group: "Campus fellowship", statuses: { devotional: "missing", ministry: "nil", meetings: "reported" } }, { userId: "b", name: "Nneka Musa", roleLabel: "Group leader", group: "Campus fellowship", statuses: { devotional: "reported", ministry: "missing", meetings: "nil" } }, { userId: "c", name: "Ruth Eze", roleLabel: "Member", group: "Nneka’s Yaba group", statuses: { devotional: "reported", ministry: "reported", meetings: "reported" } }]} />
    : screen === "create" ? <CreatePlace />
    : screen === "appoint-branch" ? <AppointBranchPastor place={place} supervisorId="p" />
    : <ChurchStructureView branches={[lagos, ibadan]} />;
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p>{body}</div>;
}
