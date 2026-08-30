import { Suspense } from "react";

import { PreSogpPage } from "@/components/sogp/pre-sogp-page";
import { SogpDashboardSkeleton } from "@/components/sogp/sogp-dashboard-skeleton";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { preSogpPreviewData } from "@/lib/sogp/preview-fixtures";

export default function PreSogpPreviewPage() {
  return (
    <SogpQueryProvider>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <PreSogpPage initialData={preSogpPreviewData} preview />
      </Suspense>
    </SogpQueryProvider>
  );
}
