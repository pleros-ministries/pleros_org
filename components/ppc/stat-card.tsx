import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
};

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <article className="rounded-sm border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        {Icon && <Icon className="size-3.5 text-zinc-400" />}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-zinc-400">{hint}</p>}
    </article>
  );
}
