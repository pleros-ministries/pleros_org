import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { OversightReports, OversightStructure, OversightUpdates } from "@/components/dashboard/church/group-oversight-view";
import type { GroupOversightData, GroupOversightPerson } from "@/lib/db/queries/group-oversight";
import type { OversightUpdate } from "@/lib/db/queries/oversight-updates";

export const metadata = { title: "Oversight preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

type Status = GroupOversightPerson["statuses"];
const ok: Status = { devotional: "reported", ministry: "reported", meetings: "reported" };
const part: Status = { devotional: "reported", ministry: "missing", meetings: "nil" };
const none: Status = { devotional: "missing", ministry: "missing", meetings: "missing" };

function person(userId: string, name: string, statuses: Status, group: [number, string, string, string] | null, depth: number | null, leads = 0, silentDays = 0): GroupOversightPerson {
  return { userId, name, overseerId: group?.[2] ?? null, overseerName: group?.[3] ?? null, groupId: group?.[0] ?? null, groupName: group?.[1] ?? null, depth, branchId: null, leadsMembers: leads, atRisk: false, statuses, reportedToday: statuses !== none, silentDays, messageUserId: null };
}

const campus: [number, string, string, string] = [1, "Campus fellowship", "me", "You"];
const online: [number, string, string, string] = [2, "Online SOGP members", "me", "You"];
const hallC: [number, string, string, string] = [3, "Hall C Bible study", "p1", "Tolu Adebayo"];
const evening: [number, string, string, string] = [4, "Grace's evening group", "p4", "Grace Eze"];

const PEOPLE = [
  person("p1", "Tolu Adebayo", ok, campus, 1, 2),
  person("p2", "Efe Daniels", part, campus, 1),
  person("p3", "Kunle Bello", none, campus, 1, 0, 3),
  person("p4", "Grace Eze", ok, online, 1, 2),
  person("p5", "Amaka Obi", ok, online, 1),
  person("p6", "Chidi Okafor", part, hallC, 2),
  person("p7", "Ifeoma Nwosu", none, hallC, 2),
  person("p8", "Ruth Musa", ok, evening, 2),
  person("p9", "Dayo Ade", part, evening, 2),
];

const DATA: GroupOversightData = {
  role: "leader", scopeLabel: "2 groups", under: null, day: "2026-10-20", people: PEOPLE,
  groups: [{ id: 1, name: "Campus fellowship", members: 3, reportedToday: 2 }, { id: 2, name: "Online SOGP members", members: 2, reportedToday: 2 }],
  memberOf: null, branches: [], waiting: [],
  totals: { people: PEOPLE.length, reportedToday: 6, atRisk: 0, waiting: 0, silent: 1 },
};

const UPDATES: OversightUpdate[] = [
  { key: "questions:p1", kind: "question", title: "2 questions waiting over 3 days", detail: "Tolu’s group", href: "#", at: "2026-10-16T05:40:00Z", done: false },
  { key: "joined:9", kind: "joined", title: "Amaka joined Online SOGP members", detail: "", href: "#", at: "2026-10-20T08:30:00Z", done: false },
  { key: "quiet:p3", kind: "silent", title: "Kunle hasn’t reported in 3 days", detail: "Campus fellowship", href: "#", at: null, done: false },
  { key: "quiet:p2", kind: "risk", title: "Efe is falling behind in SOGP", detail: "Campus fellowship", href: "#", at: null, done: true },
];

/** The real Oversight views on sample data (no sign-in needed): `?tab=reports|updates`. Nothing here saves. */
export default async function OversightPreview({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const days = ["2026-10-20", "2026-10-19", "2026-10-18", "2026-10-17", "2026-10-16"];
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Preview · sample data · nothing saved</p>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7">
      {tab === "reports" ? <OversightReports data={DATA} updates={3} days={days} today={days[0]!} remind={false} />
        : tab === "updates" ? <OversightUpdates data={DATA} updates={UPDATES} />
        : <OversightStructure data={DATA} updates={3} />}
    </div>
  </div>;
}
