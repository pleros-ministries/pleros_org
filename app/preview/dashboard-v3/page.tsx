import type { Metadata } from "next";
import localFont from "next/font/local";
import { DashboardBaseline } from "@/components/dashboard/v3/baseline";

const font = localFont({ src: [
  { path: "../../fonts/be-vietnam-pro/BeVietnamPro-Regular.ttf", weight: "400", style: "normal" },
  { path: "../../fonts/be-vietnam-pro/BeVietnamPro-Medium.ttf", weight: "500", style: "normal" },
  { path: "../../fonts/be-vietnam-pro/BeVietnamPro-SemiBold.ttf", weight: "600", style: "normal" },
  { path: "../../fonts/be-vietnam-pro/BeVietnamPro-Bold.ttf", weight: "700", style: "normal" },
], display: "block", adjustFontFallback: false });

export const metadata: Metadata = { title: "Pleros visual baseline", robots: { index: false, follow: false } };
export default async function BaselinePage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const query = await searchParams;
  const role = query.role === "pastor" || query.role === "unit-leader" ? query.role : "learner";
  return <div className={font.className}><DashboardBaseline role={role} /></div>;
}
