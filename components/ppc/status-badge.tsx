import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  variant?: "default" | "success" | "warning" | "danger";
};

const variantStyles: Record<string, string> = {
  default: "bg-zinc-100 text-zinc-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize",
        variantStyles[variant],
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
