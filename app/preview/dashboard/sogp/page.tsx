import { Suspense } from "react";

import { SogpDashboardSkeleton } from "@/components/sogp/sogp-dashboard-skeleton";
import { SogpJourneyPage } from "@/components/sogp/sogp-journey-page";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { sogpPreviewData } from "@/lib/sogp/preview-fixtures";

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** The SOGP calendar on sample data; `?path=podcast` shows it for a podcast-path learner. */
export default async function SogpPreviewPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const { path } = await searchParams;
  const data = path === "podcast" ? { ...sogpPreviewData, path: "podcast" as const } : sogpPreviewData;
  return (
    <SogpQueryProvider>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <SogpJourneyPage key={data.path} initialData={data} preview />
      </Suspense>
    </SogpQueryProvider>
  );
}
