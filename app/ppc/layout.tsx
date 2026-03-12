import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PPC Platform",
  description: "Pleros Perfecting Courses platform",
};

export default function PpcRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
