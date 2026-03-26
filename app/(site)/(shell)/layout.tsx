import type { ReactNode } from "react";

import { SiteShell } from "@/components/site/site-shell";

export default function MarketingShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
