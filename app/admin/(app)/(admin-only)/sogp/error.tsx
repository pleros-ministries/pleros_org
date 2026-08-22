"use client";

export default function AdminSogpError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-sm border border-rose-200 bg-rose-50 p-5">
      <h1 className="ppc-heading text-sm font-semibold text-rose-950">SOGP operations could not load</h1>
      <button type="button" onClick={reset} className="mt-4 h-8 rounded-sm bg-rose-900 px-3 text-xs font-medium text-white">Try again</button>
    </div>
  );
}
