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
          "theme-questions border-transparent bg-[var(--page-accent-soft)] text-[var(--page-accent)]",
        purpose:
          "theme-purpose border-transparent bg-[var(--page-accent-soft)] text-[var(--page-accent)]",
        fulfil:
          "theme-fulfil border-transparent bg-[var(--page-accent-soft)] text-[var(--page-accent)]",
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
