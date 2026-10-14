import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { ChurchHomeView } from "@/components/dashboard/church/church-home";
import { ChurchOversight } from "@/components/dashboard/church/church-oversight";
import { AddWorkers, AppointLeader, CreatePlace } from "@/components/dashboard/church/church-flows";
import type { ChurchHome, ChurchPlace } from "@/lib/db/queries/church-home";

export const metadata = { title: "Church visual preview", robots: { index: false, follow: false } };

const unit = (id: number, name: string, leader: string | null, workers: number) => ({ id, name, branchId: 1, leader: leader ? { userId: `l${id}`, name: leader } : null, workerCount: workers });
const lagos = { id: 1, name: "Lagos", pastors: [{ userId: "bp", name: "Bayo Adeyemi" }], units: [unit(1, "Hospitality", "Ruth Akinola", 6), unit(2, "Worship", "Kunle Adebayo", 5), unit(3, "Media", "Nkechi Amadi", 4), unit(4, "Children’s team", null, 0)], workerCount: 15, leaderlessUnits: 1 };
const ibadan = { id: 2, name: "Ibadan", pastors: [{ userId: "mb", name: "Miriam Bello" }], units: [unit(5, "Ushering", "Ade Ojo", 6), unit(6, "Prayer", "Tayo Ade", 4)], workerCount: 10, leaderlessUnits: 0 };
const homes: Record<string, ChurchHome> = {
  pastor: { kind: "structure", role: "pastor", viewerName: "Tolu Olawale", branches: [lagos, ibadan], totals: { branches: 2, units: 6, workers: 25 } },
  branch: { kind: "structure", role: "branch_pastor", viewerName: "Bayo Adeyemi", branches: [lagos, ibadan], totals: { branches: 2, units: 6, workers: 25 } },
  unit: { kind: "unit", unit: { id: 3, name: "Media", branchName: "Lagos" }, leaderName: "Nkechi Amadi", reportsTo: "Bayo Adeyemi", workers: ["Ebuka Eze", "Qudus Bello", "Amina Yusuf"].map((name, index) => ({ userId: `w${index}`, name })) },
  worker: { kind: "placement", name: "Maryam Ali", unitName: "Media", branchName: "Lagos", line: [{ role: "Pastor", name: "Tolu Olawale", scope: "Fullness of Christ Church" }, { role: "Branch pastor", name: "Bayo Adeyemi", scope: "Lagos" }, { role: "Unit leader", name: "Nkechi Amadi", scope: "Media team" }, { role: "Worker", name: "Maryam Ali", scope: "Worker · Media" }] },
};
const place = (withLeader: boolean): ChurchPlace => ({ viewerRole: "branch_pastor", viewerId: "bp", branch: { id: 1, name: "Lagos" }, pastors: [{ userId: "bp", name: "Bayo Adeyemi" }],
  unit: { id: 3, name: withLeader ? "Media" : "Children’s team", branchId: 1, leader: withLeader ? { userId: "l3", name: "Nkechi Amadi" } : null, workers: withLeader ? [{ userId: "w1", name: "Ebuka Eze" }] : [] } });

/** Labelled sample data. Flow buttons call live actions, which refuse without a session. */
export default async function ChurchPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const { screen = "pastor" } = await searchParams;
  const body = screen === "oversight" ? <ChurchOversight day="2026-10-13" dayLabel="Tue 13 Oct" scope="Lagos branch" remindersEnabled rows={[{ userId: "a", name: "Dayo Eze", roleLabel: "Worker", group: "Welcome team", statuses: { devotional: "missing", ministry: "nil", meetings: "reported" } }, { userId: "b", name: "Nneka Musa", roleLabel: "Worker", group: "Welcome team", statuses: { devotional: "reported", ministry: "missing", meetings: "nil" } }, { userId: "c", name: "Ruth Eze", roleLabel: "Worker", group: "Welcome team", statuses: { devotional: "reported", ministry: "reported", meetings: "reported" } }]} />
    : screen === "create" ? <CreatePlace /> : screen === "appoint" ? <AppointLeader place={place(false)} role="unit_leader" supervisorId="bp" /> : screen === "appoint-branch" ? <AppointLeader place={{ ...place(false), viewerRole: "pastor", pastors: [], unit: null }} role="branch_pastor" supervisorId="p" /> : screen === "allocate" ? <AddWorkers place={place(true)} /> : <ChurchHomeView data={homes[screen] ?? homes.pastor} canOversee />;
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p>{body}</div>;
}
