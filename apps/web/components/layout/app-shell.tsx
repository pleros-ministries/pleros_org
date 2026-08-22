import { HomepageNav } from "../home/homepage-nav";
import { HomepageFooter } from "../home/homepage-footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-font-theme flex min-h-screen flex-col">
      <HomepageNav />
      <main className="flex-1">{children}</main>
      <HomepageFooter />
    </div>
  );
}
