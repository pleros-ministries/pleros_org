import { cn } from "@/lib/utils";

type LevelBadgeProps = {
  level: number;
  size?: "sm" | "md";
};

export function LevelBadge({ level, size = "sm" }: LevelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-zinc-900 font-medium text-white",
        size === "sm" ? "h-5 min-w-[28px] px-1.5 text-[10px]" : "h-6 min-w-[32px] px-2 text-xs",
      )}
    >
      L{level}
    </span>
  );
}
