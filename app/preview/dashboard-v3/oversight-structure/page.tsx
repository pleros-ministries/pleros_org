import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { OversightStructureMockup } from "@/components/dashboard/church/oversight-structure-mockup";
import type { GroupOversightData, GroupOversightPerson } from "@/lib/db/queries/group-oversight";

export const metadata = { title: "Oversight structure mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

type Status = GroupOversightPerson["statuses"];
const ok: Status = { devotional: "reported", ministry: "reported", meetings: "reported" };
const part: Status = { devotional: "reported", ministry: "missing", meetings: "nil" };
const none: Status = { devotional: "missing", ministry: "missing", meetings: "missing" };

function person(userId: string, name: string, statuses: Status, group: [number, string, string, string], depth: number | null, leads = 0): GroupOversightPerson {
  return { userId, name, overseerId: group[2], overseerName: group[3], groupId: group[0], groupName: group[1], depth, branchId: null, leadsMembers: leads, atRisk: false, statuses, reportedToday: statuses !== none, silentDays: 0, messageUserId: null };
}

const sunday: [number, string, string, string] = [1, "Sunday workers", "me", "You"];
const elders: [number, string, string, string] = [2, "Elders", "me", "You"];
const hallC: [number, string, string, string] = [3, "Hall C Bible study", "p1", "Tolu Adebayo"];
const evening: [number, string, string, string] = [4, "Grace's evening group", "p4", "Grace Eze"];
// Groups elsewhere in the church, whose leaders aren't under you.
const ibadan: [number, string, string, string] = [5, "Ibadan youth", "x1", "Bisi Ogun"];
const lekki: [number, string, string, string] = [6, "Lekki home cell", "x2", "Femi Lawal"];
const abuja: [number, string, string, string] = [7, "Abuja campus fellowship", "x3", "Ngozi Eke"];
const online: [number, string, string, string] = [8, "Online SOGP members", "x4", "Seun Ade"];

const PEOPLE = [
  person("p1", "Tolu Adebayo", ok, sunday, 1, 2),
  person("p2", "Efe Daniels", part, sunday, 1),
  person("p3", "Kunle Bello", none, sunday, 1),
  person("p4", "Grace Eze", ok, elders, 1, 2),
  person("p5", "Amaka Obi", ok, elders, 1, 3),
  person("p6", "Chidi Okafor", part, hallC, 2),
  person("p7", "Ifeoma Nwosu", none, hallC, 2),
  person("p8", "Ruth Musa", ok, evening, 2),
  person("p9", "Dayo Ade", part, evening, 2),
  person("o1", "Yemi Alade", ok, ibadan, null), person("o2", "Tunde Bakare", none, ibadan, null), person("o3", "Kemi Oni", ok, ibadan, null),
  person("o4", "Sola Peters", part, lekki, null), person("o5", "Joy Uche", ok, lekki, null),
  person("o6", "Ade Balogun", ok, abuja, null), person("o7", "Mercy Idowu", none, abuja, null), person("o8", "Victor Ojo", ok, abuja, null), person("o9", "Esther Ola", ok, abuja, null),
  person("o10", "Paul Etim", part, online, null),
];

const DATA: GroupOversightData = {
  role: "pastor", scopeLabel: "The whole church", under: null, day: "2026-10-21", people: PEOPLE,
  groups: [{ id: 1, name: "Sunday workers", members: 3, reportedToday: 2 }, { id: 2, name: "Elders", members: 2, reportedToday: 2 }],
  memberOf: null, branches: [], waiting: [],
  totals: { people: PEOPLE.length, reportedToday: 12, atRisk: 0, waiting: 0, silent: 0 },
};

/** Mockup: `?page=structure|other`, `?role=pastor|branch_pastor`. Nothing saves. */
export default async function OversightStructurePreview({ searchParams }: { searchParams: Promise<{ page?: string; role?: string }> }) {
  const params = await searchParams;
  const page = params.page === "other" ? "other" : "structure";
  const role = params.role === "branch_pastor" ? "branch_pastor" : "pastor";
  const tab = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · sample data · nothing saved</span>
      <span className="flex gap-3">
        {tab("Pastor", `?page=${page}&role=pastor`, role === "pastor")}
        {tab("Branch pastor", `?page=${page}&role=branch_pastor`, role === "branch_pastor")}
      </span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <OversightStructureMockup data={role === "pastor" ? DATA : { ...DATA, role: "branch_pastor", scopeLabel: "Ibadan branch" }} page={page} role={role} />
    </div>
  </div>;
}
