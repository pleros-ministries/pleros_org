"use client";

export default function DashboardError({ retry }: { retry: () => void }) {
  return <section className="mx-auto max-w-xl p-5"><h1>Dashboard unavailable</h1><p role="alert" className="mt-3 text-sm">We couldn’t load this page. Please try again.</p><button className="mt-4 min-h-12 rounded-[11px] bg-(--color-brand-blue) px-4 text-sm font-medium text-white" onClick={retry}>Try again</button></section>;
}
