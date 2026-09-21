import { Suspense } from "react";

import { ReferralsPage } from "@/components/sogp/referrals-page";
import { SogpDashboardSkeleton } from "@/components/sogp/sogp-dashboard-skeleton";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { referralsPreviewData } from "@/lib/sogp/preview-fixtures";

export default function SogpReferralsPreviewPage() {
  return (
    <SogpQueryProvider>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <ReferralsPage initialData={referralsPreviewData} preview />
      </Suspense>
    </SogpQueryProvider>
  );
}
