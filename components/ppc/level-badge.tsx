import { cn } from "@/lib/utils";

type LevelBadgeProps = {
  level: number;
  size?: "sm" | "md";
  variant?: "dark" | "light";
};

export function LevelBadge({ level, size = "sm", variant = "dark" }: LevelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        variant === "dark"
          ? "bg-zinc-900 text-white"
          : "bg-white/20 text-white border border-white/30",
        size === "sm" ? "h-5 min-w-[28px] px-1.5 text-[10px]" : "h-6 min-w-[32px] px-2 text-xs",
      )}
    >
      L{level}
    </span>
  );
}
