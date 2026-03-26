import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] border border-transparent px-4.5 py-2.5 [font-size:var(--text-sm)] font-medium leading-none transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-150 ease-out outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-[var(--color-focus)] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current [&_svg]:stroke-current",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[var(--color-primary-hover)] hover:text-white hover:shadow-[var(--shadow-md)] focus-visible:text-white",
        secondary:
          "border-[var(--color-line-strong)] bg-white/85 text-[var(--color-text-strong)] hover:-translate-y-px hover:border-[var(--color-line)] hover:bg-white hover:shadow-[var(--shadow-sm)]",
        questions:
          "theme-questions bg-[var(--page-accent)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[var(--page-accent)] hover:text-white hover:opacity-95 hover:shadow-[var(--page-accent-glow)]",
        purpose:
          "theme-purpose bg-[var(--page-accent)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[var(--page-accent)] hover:text-white hover:opacity-95 hover:shadow-[var(--page-accent-glow)]",
        fulfil:
          "theme-fulfil bg-[var(--page-accent)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[var(--page-accent)] hover:text-white hover:opacity-95 hover:shadow-[var(--page-accent-glow)]",
        outline:
          "border-[var(--color-line-strong)] bg-transparent text-[var(--color-text)] hover:border-[var(--color-brand-blue)] hover:bg-[var(--page-accent-soft)]",
        ghost:
          "bg-transparent text-[var(--color-text)] hover:bg-[var(--page-accent-soft)]",
        destructive:
          "bg-[var(--destructive)] text-white hover:-translate-y-px hover:brightness-95",
        link:
          "bg-transparent p-0 text-[var(--color-link)] underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-9 px-3.5 [font-size:var(--text-xs)]",
        lg: "min-h-12 px-5 [font-size:var(--text-body)]",
        icon: "size-10 min-h-0 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);
