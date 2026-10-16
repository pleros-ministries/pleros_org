import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
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
test("the drawer renders the admin workspace without restoring the destination dump",()=>{
  const sections = buildDashboardNavigation({ sogpEnrolled:true,community:true,communityUnitId:9,discipleshipDiscussions:true,managesLocationGroups:false,staffConsole:false,staffWorkspace:"super_admin" });
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><DashboardMenuNavigation sections={sections} area="you" onArea={()=>{}} /></QueryClientProvider>);
  expect(html).toContain('href="/admin"');
  expect(html).toContain(">Admin<");
  expect(html).not.toContain("More destinations");
});
test("the isolated baseline does not preserve the retired destination dump",()=>{
  const source = fs.readFileSync(path.join(process.cwd(), "components/dashboard/v3/baseline.tsx"), "utf8");
  const styles = fs.readFileSync(path.join(process.cwd(), "components/dashboard/v3/dashboard.module.css"), "utf8");
  expect(source).not.toContain("More destinations");
  expect(source).not.toContain("Retained dashboard destinations");
  expect(styles).not.toContain(".retained");
  expect(styles).not.toContain(".essentials");
});
