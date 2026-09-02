import type { ReactNode } from "react";

export function SogpActivitySection({
  id,
  title,
  description,
  icon,
  action,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-sm border border-zinc-200 bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <span className="grid min-w-0 gap-0.5">
          <span className="flex items-center gap-2">
            {icon}
            <span className="ppc-heading text-sm font-semibold text-zinc-900">
              {title}
            </span>
          </span>
          {description ? (
            <span className="text-xs leading-[1.45] text-zinc-500">
              {description}
            </span>
          ) : null}
        </span>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="grid gap-3 p-4">{children}</div>
    </section>
  );
}
