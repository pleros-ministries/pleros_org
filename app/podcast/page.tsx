import Link from "next/link";

export default function PodcastPage() {
  return (
    <main className="ambient-bg min-h-screen px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-line/80 bg-surface/95 p-6 shadow-[0_25px_75px_-48px_rgba(0,0,0,.48)] sm:p-8">
        <p className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted">
          Podcast
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight font-semibold text-foreground sm:text-5xl">
          Pleros Podcast
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          This route is ready for your podcast library integration. Use this
          page for episodes, player controls, and listening history.
        </p>

        <Link
          href="/dashboard"
          className="mt-7 inline-flex items-center rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:-translate-y-0.5"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
