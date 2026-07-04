import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PPC Admin",
  description: "Pleros Perfecting Courses staff administration",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="ppc-theme">{children}</div>;
}
