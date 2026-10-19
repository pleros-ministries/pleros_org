import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect,test,vi } from "vitest";
import { DashboardMenuNavigation } from "@/components/dashboard/shell/dashboard-menu-navigation";
import { buildCommunitySwitcherItems, communityTitleForPath } from "@/components/community/community-tabs";
import { buildDashboardNavigation } from "./navigation";
vi.mock("next/navigation",()=>({ usePathname: () => "/dashboard" }));
test("the default drawer renders only approved roots/workspace, not the legacy destination inventory",()=>{
  const sections = buildDashboardNavigation({ sogpEnrolled:true,community:true,communityUnitId:9,discipleshipDiscussions:true,managesLocationGroups:false,staffConsole:false });
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><DashboardMenuNavigation sections={sections} area="you" onArea={()=>{}} /></QueryClientProvider>);
  expect(html).toContain('href="/dashboard/sogp"');
  expect(html).toContain('href="/dashboard/community"');
  // Saved contacts moved under Groups (Community), out of the You workspace.
  expect(html).not.toContain('href="/dashboard/community/contacts"');
  expect(html).not.toContain('href="/dashboard/sogp/certificate"');
  expect(html).not.toContain('href="/dashboard/welcomepack/orientation"');
  expect(html).not.toContain("More destinations");
});
test("church tools remain capability-scoped and absent for ordinary learners",()=>{
  // Groups as oversight (19 October): Oversight lives inside Community, for group leaders, the Pastor and branch pastors.
  const sections = buildDashboardNavigation({ sogpEnrolled:true,community:true,communityUnitId:9,discipleshipDiscussions:true,managesLocationGroups:false,staffConsole:false,groupOversight:true,reporting:true });
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><DashboardMenuNavigation sections={sections} area="community" onArea={()=>{}} /></QueryClientProvider>);
  expect(html).toContain('href="/dashboard/community/oversight"');
  expect(html).not.toContain('href="/dashboard/church"');
  const ordinary = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><DashboardMenuNavigation sections={buildDashboardNavigation({ sogpEnrolled:true,community:true,communityUnitId:9,discipleshipDiscussions:true,managesLocationGroups:false,staffConsole:false,groupOversight:false })} area="community" onArea={()=>{}} /></QueryClientProvider>);
  expect(ordinary).not.toContain('href="/dashboard/community/oversight"');
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
test("the live dashboard keeps current learning on the blue card treatment",()=>{
  const source = fs.readFileSync(path.join(process.cwd(), "components/dashboard/v3/home-view.tsx"), "utf8");
  expect(source).toContain("styles.adaptiveLearningCard");
  expect(source).toContain("styles.learningCard");
  expect(source).not.toContain("<article className={styles.whiteCard}");
});
test("the You and Community homes use the raised-card canvas treatment",()=>{
  const you = fs.readFileSync(path.join(process.cwd(), "components/dashboard/v3/dashboard.module.css"), "utf8");
  const community = fs.readFileSync(path.join(process.cwd(), "components/community/community-home-v3.module.css"), "utf8");
  expect(you).toMatch(/\.content \{[^}]*background: var\(--color-community-canvas\)/);
  expect(you).toMatch(/\.learning, \.reports, \.support \{[^}]*background: white;[^}]*box-shadow: var\(--shadow-sm\)/);
  expect(community).toMatch(/\.home \{[^}]*background: var\(--color-community-canvas\)/);
  expect(community).toMatch(/\.section \{[^}]*background: white;[^}]*box-shadow: var\(--shadow-sm\)/);
});
test("the dashboard canvas and card edges remain visible on low-contrast phone displays",()=>{
  const global = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const learning = fs.readFileSync(path.join(process.cwd(), "components/sogp/learning/learning.module.css"), "utf8");
  expect(global).toContain("--color-community-canvas: #f8f6f2");
  expect(global).toContain("--color-community-edge: #d9dde3");
  expect(learning).toMatch(/\.homePage \{[^}]*background: var\(--color-community-canvas\)/);
  expect(learning).toMatch(/\.learningGroup \{[^}]*background: white;[^}]*border: 1px solid var\(--color-community-edge\)/);
});
test("authenticated dashboard headings use Sen while body and controls retain Inter",()=>{
  const styles = fs.readFileSync(path.join(process.cwd(), "components/dashboard/v3/dashboard.module.css"), "utf8");
  // Its own variable: the shell remaps --font-sen to the body face.
  expect(styles).toMatch(/\.root :is\(h1, h2, h3\) \{[^}]*font-family: var\(--font-dashboard-heading\), "Sen", sans-serif/);
  expect(styles).toMatch(/\.root \{[^}]*font-size: 14px/);
});
test("the Community home keeps the section switcher available",()=>{
  const source = fs.readFileSync(path.join(process.cwd(), "components/community/community-shell.tsx"), "utf8");
  // The title bar and switcher are retired; the five destinations stay in the bar.
  expect(source).toContain("<CommunityBottomBar placement=\"top\" oversightHref={oversightHref} />");
  expect(source).toContain("<CommunityBottomBar oversightHref={oversightHref} />");
  expect(source).toContain("<InboxSwitch />");
  expect(source).not.toContain("!home ?");
});
test("the Community switcher leads with role and location context",()=>{
  const items = buildCommunitySwitcherItems([
    { key:"feed",label:"Feed",href:"/dashboard/community/feed" },
    { key:"location-group",label:"Your location group",href:"/dashboard/community/unit/5" },
    { key:"groups",label:"Groups",href:"/dashboard/community/groups" },
    { key:"messages",label:"Messages",href:"/dashboard/community/messages" },
    { key:"disciples",label:"My disciples",href:"/dashboard/sogp/discipleship" },
    { key:"enrollees",label:"My enrollees",href:"/dashboard/sogp/enrollees" },
  ]);
  expect(items.map(item=>item.label)).toEqual([
    "My disciples",
    "My enrollees",
    "Your location group",
    "Community home",
    "Feed",
    "Groups",
    "Messages",
  ]);
});
test("saved contacts has its own Community context instead of daily report",()=>{
  expect(communityTitleForPath("/dashboard/community/report/people", null)).toBe("Saved contacts");
  expect(communityTitleForPath("/dashboard/community/report/people/new", null)).toBe("Saved contacts");
  expect(communityTitleForPath("/dashboard/community/report/new", null)).toBe("Daily report");
});
