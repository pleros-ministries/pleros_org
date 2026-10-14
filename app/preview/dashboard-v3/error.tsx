"use client";

export default function Error({ retry }: { retry: () => void }) {
  return <main className="mx-auto max-w-3xl p-5"><h1>Dashboard unavailable</h1><p role="alert">We couldn’t load this preview. Please try again.</p><button onClick={retry} className="mt-4 min-h-12 rounded-[11px] border px-4">Try again</button></main>;
}
