import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "h-11 w-full min-w-0 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-white/95 px-4 py-2.5 text-[var(--text-body)] text-[var(--color-text)] outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-out placeholder:text-[var(--color-text-muted)] focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)] disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "",
        muted: "bg-[var(--color-surface-muted)]",
      },
      size: {
        default: "",
        sm: "h-9 px-3 py-2 text-[var(--text-sm)]",
        lg: "h-12 px-4 py-3 text-[var(--text-body-lg)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type InputProps = React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants>;

function Input({
  className,
  type,
  variant,
  size,
  ...props
}: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
