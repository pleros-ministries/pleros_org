import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-8 w-fit items-center gap-1 rounded-[var(--radius-pill)] border px-3 py-1 text-[var(--text-xs)] font-medium leading-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--page-accent-soft)] text-[var(--page-accent)]",
        outline:
          "border-[var(--color-line-strong)] bg-white/80 text-[var(--color-text)]",
        questions:
          "theme-questions border border-[var(--page-accent)]/30 bg-white text-[var(--page-accent)] shadow-[0_1px_2px_rgba(15,23,40,0.06)]",
        purpose:
          "theme-purpose border border-[var(--page-accent)]/30 bg-white text-[var(--page-accent)] shadow-[0_1px_2px_rgba(15,23,40,0.06)]",
        fulfil:
          "theme-fulfil border border-[var(--page-accent)]/30 bg-white text-[var(--page-accent)] shadow-[0_1px_2px_rgba(15,23,40,0.06)]",
        dark:
          "border-white/10 bg-white/10 text-[var(--color-text-on-dark)] backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
