import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {}, refresh() {}, replace() {} }) }));
vi.mock("@/app/admin/_actions/sogp-report-actions", () => ({ getAdminSogpDailyParticipation: async () => [] }));
vi.mock("@/app/(site)/dashboard/sogp/discipleship/_actions", () => ({
  getDiscipleParticipationAction: async () => [], leaveDiscipleshipGroupAction: async () => ({ ok: true }),
  logWhatsAppContactAction: async () => ({ ok: true }), regenerateInviteLinkAction: async () => ({ ok: true }),
  removeDiscipleAction: async () => ({ ok: true }), setDiscipleSharesPhoneAction: async () => ({ ok: true }),
  setLeaderSharesPhoneAction: async () => ({ ok: true }), createDiscipleshipGroupAction: async () => ({ ok: true }),
  closeDiscipleshipGroupAction: async () => ({ ok: true }), renameDiscipleshipGroupAction: async () => ({ ok: true }),
}));
vi.mock("@/app/(site)/dashboard/community/_actions/report-actions", () => ({ getDiscipleMinistryAction: async () => [] }));
import { DiscipleshipPage } from "@/components/sogp/discipleship-page";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { DiscipleProfile } from "@/components/sogp/discipleship-v3";
import { discipleshipPreviewData } from "./preview-fixtures";
import type { DiscipleshipDashboardData } from "@/lib/db/queries/sogp-discipleship";

function render(data: DiscipleshipDashboardData) {
  return renderToStaticMarkup(<SogpQueryProvider><DiscipleshipPage data={data} preview /></SogpQueryProvider>);
}
describe("connected Discipleship presentation", () => {
  it("uses the real person's identity and retains the supplied detail controls", () => {
    const html = renderToStaticMarkup(<DiscipleProfile name="Amara Okafor" groupName="Tolu's group"><button>Log follow-up</button><p>7 of 24 assessments</p></DiscipleProfile>);
    for (const text of ["Amara Okafor","Tolu&#x27;s group","Connected","Log follow-up","7 of 24 assessments"]) expect(html).toContain(text);
    expect(html).not.toContain("15 min/day");
  });
  it("a paused profile never claims an active connection", () => {
    const html = renderToStaticMarkup(<DiscipleProfile name="Amara Okafor" groupName="Tolu's group" paused><p>Retained progress</p></DiscipleProfile>);
    expect(html).toContain("Group paused");
    expect(html).not.toContain(">Connected<");
    expect(html).toContain("Retained progress");
  });
  it("keeps Overview, private Check-ins and recorded Reviews independently reachable", () => {
    const html = renderToStaticMarkup(<DiscipleProfile name="Amara Okafor" groupName="Tolu's group" checkIns={<p>Private answer</p>} reviews={<p>Recorded reviews</p>}><p>Assessment progress</p></DiscipleProfile>);
    expect(html).toContain('role="tablist"');
    for (const label of [">Overview<",">Check-ins<",">Reviews<"]) expect(html).toContain(label);
    expect(html).toContain("Assessment progress");
    expect(html).not.toContain("Private answer");
  });
  it("renders the redesigned page identity while retaining leader tools", () => {
    const html = render(discipleshipPreviewData);
    expect(html).toContain(">My disciples</h1>");
    for (const text of ["Groups you lead", "Group you", "Campus fellowship", "New group", "Rename", "Grace Adeyemi", "Samuel Okafor", "Blessing Eze", "Previous day", "Next day", "Check-ins", "Prayer requests"]) expect(html).toContain(text);
  });
  it("keeps group member check-ins, prayer requests, consent and leave controls", () => {
    const data = { ...discipleshipPreviewData, ledGroups: discipleshipPreviewData.ledGroups.map(group => ({ ...group,discipleCount: 0 })) };
    const html = render(data);
    for (const text of ["Your discipler", "Kemi", "prayer request", "WhatsApp", "Leave group"]) expect(html).toContain(text);
    expect(html).toContain('role="tabpanel"');
  });
  it("a paused group retains its explanation without offering invitations or check-in writes", () => {
    const data: DiscipleshipDashboardData = { ...discipleshipPreviewData,createGroupBlock: "A group is paused.",ledGroups: discipleshipPreviewData.ledGroups.map(group => group.id === discipleshipPreviewData.selectedGroup.id ? { ...group,status: "archived" } : group), selectedGroup: { ...discipleshipPreviewData.selectedGroup,status: "archived" } };
    const html = render(data);
    expect(html).toContain("paused by the Pleros team");
    expect(html).not.toContain("Create a new link");
    expect(html).not.toContain("Ask this group");
    expect(html).not.toContain(">New group<");
  });
  it("empty groups retain invitations and group controls without fabricating disciples", () => {
    const data = { ...discipleshipPreviewData,myDiscipler: null,selectedGroup: { ...discipleshipPreviewData.selectedGroup,disciples: [] } };
    const html = render(data);
    expect(html).toContain("No one yet");
    expect(html).toContain("Create a new link");
    expect(html).toContain("Rename");
    expect(html).not.toContain("Grace Adeyemi");
  });
});
