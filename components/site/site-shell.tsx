import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell-bg site-grid min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
