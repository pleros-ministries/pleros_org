import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect,test,vi } from "vitest";
import { DashboardMenuNavigation } from "@/components/dashboard/shell/dashboard-menu-navigation";
import { buildDashboardNavigation } from "./navigation";
vi.mock("next/navigation",()=>({ usePathname: () => "/dashboard" }));
test("the default drawer renders only approved roots/workspace, not the legacy destination inventory",()=>{
  const sections = buildDashboardNavigation({ sogpEnrolled:true,community:true,communityUnitId:9,discipleshipDiscussions:true,managesLocationGroups:false,staffConsole:false });
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><DashboardMenuNavigation sections={sections} area="you" onArea={()=>{}} /></QueryClientProvider>);
  expect(html).toContain('href="/dashboard/sogp"');
  expect(html).toContain('href="/dashboard/community"');
  expect(html).toContain('href="/dashboard/community/report/people"');
  expect(html).not.toContain('href="/dashboard/sogp/certificate"');
  expect(html).not.toContain('href="/dashboard/welcomepack/orientation"');
  expect(html).not.toContain("More destinations");
});
test("church tools remain capability-scoped and absent for ordinary learners",()=>{
  const sections = buildDashboardNavigation({ sogpEnrolled:false,community:false,communityUnitId:null,discipleshipDiscussions:false,managesLocationGroups:false,staffConsole:false,churchAssignments:true,reporting:true });
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><DashboardMenuNavigation sections={sections} area="you" onArea={()=>{}} /></QueryClientProvider>);
  expect(html).toContain('href="/dashboard/church"');
  expect(html).not.toContain('href="/dashboard/community"');
});
