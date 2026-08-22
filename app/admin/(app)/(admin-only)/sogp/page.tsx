import { Suspense } from "react";

import { AdminSogpPage } from "@/components/ppc/admin-sogp-page";

function AdminSogpSkeleton() {
  return (
    <div className="grid animate-pulse gap-4" aria-label="Loading SOGP operations">
      <div className="h-16 rounded-sm bg-zinc-100" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-sm bg-zinc-100" />)}
      </div>
      <div className="h-96 rounded-sm bg-zinc-100" />
    </div>
  );
}

export default function AdminSogpRoute() {
  return <Suspense fallback={<AdminSogpSkeleton />}><AdminSogpPage /></Suspense>;
}
