export function SogpDashboardSkeleton() {
  return (
    <div
      className="mx-auto grid w-full max-w-[980px] animate-pulse gap-3 px-4 pt-4 pb-16"
      aria-label="Loading calendar and assessments"
      aria-busy="true"
    >
      <div className="h-6 w-2/3 rounded-md bg-[#eceef2]" />
      <div className="h-4 w-1/2 rounded-md bg-[#eceef2]" />
      <div className="h-28 rounded-[10px] border border-[#e2e5ea] bg-white" />
      <div className="h-80 rounded-[10px] border border-[#e2e5ea] bg-white" />
      <div className="h-40 rounded-[10px] border border-[#e2e5ea] bg-white" />
    </div>
  );
}
