import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  variant?: "default" | "success" | "warning" | "danger" | "violet";
};

const variantStyles: Record<string, string> = {
  default: "bg-zinc-100 text-zinc-600",
  success: "bg-[var(--color-community-mint-soft)] text-[var(--color-community-mint-ink)]",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  violet: "bg-[var(--color-community-plum-soft)] text-[var(--color-community-plum-ink)]",
};

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        variantStyles[variant],
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
