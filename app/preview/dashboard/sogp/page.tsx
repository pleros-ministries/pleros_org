import { Suspense } from "react";

import { SogpDashboardSkeleton } from "@/components/sogp/sogp-dashboard-skeleton";
import { SogpJourneyPage } from "@/components/sogp/sogp-journey-page";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { sogpPreviewData } from "@/lib/sogp/preview-fixtures";

export default function SogpPreviewPage() {
  return (
    <SogpQueryProvider>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <SogpJourneyPage initialData={sogpPreviewData} preview />
      </Suspense>
    </SogpQueryProvider>
  );
}
