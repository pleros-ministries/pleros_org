import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PPC Platform",
  description: "Pleros Perfecting Courses platform",
};

export default function PpcRootLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.variable} font-[family-name:var(--font-inter)]`}>{children}</div>;
}
