import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-line)] p-5 shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-150 ease-out",
  {
    variants: {
      tone: {
        default: "bg-[var(--page-surface-raised)] text-[var(--color-text)]",
        muted: "bg-[var(--page-accent-surface)] text-[var(--color-text)]",
        questions: "theme-questions bg-[var(--page-accent-surface)] text-[var(--color-text)]",
        purpose: "theme-purpose bg-[var(--page-accent-surface)] text-[var(--color-text)]",
        fulfil: "theme-fulfil bg-[var(--page-accent-surface)] text-[var(--color-text)]",
        dark: "surface-dark border-white/10 text-[var(--color-text-on-dark)] shadow-[var(--shadow-lg)]",
      },
      size: {
        default: "",
        sm: "gap-3 p-4",
        lg: "gap-5 p-6",
      },
      interactive: {
        true: "hover:-translate-y-px hover:shadow-[var(--shadow-md)]",
        false: "",
      },
    },
    defaultVariants: {
      tone: "default",
      size: "default",
      interactive: false,
    },
  },
);

type CardProps = React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants>;

function Card({ className, tone, size, interactive, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ tone, size, interactive, className }))}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid gap-1", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("h3 text-[var(--color-text-strong)]", className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("body text-[var(--color-text-muted)]", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "mt-2 flex items-center gap-3 border-t border-[var(--color-line)] pt-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
