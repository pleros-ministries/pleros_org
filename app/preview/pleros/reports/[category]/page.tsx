import { notFound } from "next/navigation";

import { CategoryView } from "@/components/preview/pleros/category-view";
import { isReportCategory } from "@/lib/preview/pleros/daily-report";

export default async function DemoReportCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isReportCategory(category)) notFound();
  return <CategoryView category={category} />;
}
