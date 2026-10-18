import type { Metadata } from "next";

// Cache Components: PPC: not adopted yet (docs/dashboard-demo/CACHE_COMPONENTS_PLAN.md).
export const instant = false;

export const metadata: Metadata = {
  title: "PPC Platform",
  description: "Pleros Perfecting Courses platform",
};

export default function PpcRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="ppc-theme">{children}</div>;
}
