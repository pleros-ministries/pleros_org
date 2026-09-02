"use client";

export function SogpDailyRequirements({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    description: string;
    complete: boolean;
    actionLabel: string;
    disabled?: boolean;
    onToggle: () => void;
    link?: { href: string; label: string };
  }>;
}) {
  const completed = items.filter((item) => item.complete).length;
  const total = items.length;
  const allDone = total > 0 && completed === total;

  return (
    <section className="rounded-sm border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          Daily requirements
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            allDone ? "text-emerald-700" : "text-zinc-500"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              allDone ? "bg-emerald-600" : "bg-zinc-300"
            }`}
          />
          {completed}/{total} done
        </span>
      </div>
      <div className="divide-y divide-zinc-100">
        {items.map((item) => (
          <article
            key={item.id}
            className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div className="grid gap-0.5">
              <h3 className="text-xs font-semibold text-zinc-900">
                {item.title}
              </h3>
              <p className="text-xs leading-[1.45] text-zinc-500">
                {item.description}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              {item.link ? (
                <a
                  href={item.link.href}
                  {...(item.link.href.startsWith("#")
                    ? {}
                    : { target: "_blank", rel: "noreferrer" })}
                  className="inline-flex h-8 items-center rounded-[6px] border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-[0.98]"
                >
                  {item.link.label}
                </a>
              ) : null}
              <button
                type="button"
                disabled={item.disabled}
                onClick={item.onToggle}
                className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-[6px] px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-45 ${
                  item.complete
                    ? "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    : "bg-[var(--color-brand-blue)] text-white"
                }`}
              >
                {item.complete ? "Mark incomplete" : item.actionLabel}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
