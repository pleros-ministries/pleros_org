import type { GroupOversightData, GroupOversightPerson } from "@/lib/db/queries/group-oversight";

/** Sample Oversight data for the Structure and Reports previews: fake names only. */
type Status = GroupOversightPerson["statuses"];
const ok: Status = { devotional: "reported", ministry: "reported", meetings: "reported" };
const part: Status = { devotional: "reported", ministry: "missing", meetings: "nil" };
const none: Status = { devotional: "missing", ministry: "missing", meetings: "missing" };

function person(userId: string, name: string, statuses: Status, group: [number, string, string, string], depth: number | null, leads = 0): GroupOversightPerson {
  return { userId, name, overseerId: group[2], overseerName: group[3], groupId: group[0], groupName: group[1], memberships: [{ groupId: group[0], groupName: group[1], overseerId: group[2], overseerName: group[3], depth }], depth, branchId: null, leadsMembers: leads, atRisk: false, statuses, reportedToday: statuses !== none, silentDays: 0, messageUserId: null };
}

const sunday: [number, string, string, string] = [1, "Sunday workers", "me", "You"];
const elders: [number, string, string, string] = [2, "Elders", "me", "You"];
const hallC: [number, string, string, string] = [3, "Hall C Bible study", "p1", "Tolu Adebayo"];
const evening: [number, string, string, string] = [4, "Grace's evening group", "p4", "Grace Eze"];
const amaka: [number, string, string, string] = [9, "Amaka's prayer cell", "p5", "Amaka Obi"];
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
  person("p10", "Bola Ige", ok, amaka, 2), person("p11", "Zainab Musa", ok, amaka, 2), person("p12", "Obinna Eze", none, amaka, 2),
  person("o1", "Yemi Alade", ok, ibadan, null), person("o2", "Tunde Bakare", none, ibadan, null), person("o3", "Kemi Oni", ok, ibadan, null),
  person("o4", "Sola Peters", part, lekki, null), person("o5", "Joy Uche", ok, lekki, null),
  person("o6", "Ade Balogun", ok, abuja, null), person("o7", "Mercy Idowu", none, abuja, null), person("o8", "Victor Ojo", ok, abuja, null), person("o9", "Esther Ola", ok, abuja, null),
  person("o10", "Paul Etim", part, online, null),
];

export const SAMPLE_OVERSIGHT: GroupOversightData = {
  role: "pastor", scopeLabel: "The whole church", under: null, day: "2026-10-21", people: PEOPLE,
  groups: [{ id: 1, name: "Sunday workers", members: 3, reportedToday: 2 }, { id: 2, name: "Elders", members: 2, reportedToday: 2 }],
  memberOf: null, branches: [], waiting: [],
  totals: { people: PEOPLE.length, reportedToday: 15, atRisk: 0, waiting: 0, silent: 0 },
};

export const sampleFor = (role: "pastor" | "branch_pastor"): GroupOversightData =>
  role === "pastor" ? SAMPLE_OVERSIGHT : { ...SAMPLE_OVERSIGHT, role: "branch_pastor", scopeLabel: "Ibadan branch" };
