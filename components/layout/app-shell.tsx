import { HomepageNav } from "../home/homepage-nav";
import { HomepageFooter } from "../home/homepage-footer";

export function AppShell({
  children,
  authenticated = false,
}: {
  children: React.ReactNode;
  authenticated?: boolean;
}) {
  return (
    <div className="site-font-theme flex min-h-screen flex-col">
      <HomepageNav showSignOut={authenticated} />
      <main className="flex-1">{children}</main>
      <HomepageFooter />
    </div>
  );
}
