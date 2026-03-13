import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
};

export function ProgressBar({ value, max = 100, size = "sm", className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full rounded-full bg-zinc-200", size === "sm" ? "h-1.5" : "h-2", className)}>
      <div
        className="h-full rounded-full bg-zinc-900 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
