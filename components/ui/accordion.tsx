"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  );
}

const accordionItemVariants = cva(
  "overflow-hidden border px-4 transition-[transform,box-shadow,border-color] duration-150 ease-out",
  {
    variants: {
      tone: {
        default: "surface-card border-[var(--color-line)]",
        muted: "surface-card-muted border-[var(--color-line)]",
        questions: "theme-questions bg-[var(--page-accent-surface)] shadow-[var(--shadow-sm)]",
        purpose: "theme-purpose bg-[var(--page-accent-surface)] shadow-[var(--shadow-sm)]",
        fulfil: "theme-fulfil bg-[var(--page-accent-surface)] shadow-[var(--shadow-sm)]",
        dark:
          "surface-dark border-white/10 bg-[linear-gradient(180deg,#14203a_0%,#0f1728_100%)] text-[var(--color-text-on-dark)]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

type AccordionItemProps = AccordionPrimitive.Item.Props &
  VariantProps<typeof accordionItemVariants>;

function AccordionItem({
  className,
  tone,
  ...props
}: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(accordionItemVariants({ tone, className }))}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex w-full items-center justify-between gap-3 py-4 text-left text-[var(--text-body)] font-medium text-[var(--color-text-strong)] outline-none transition-colors hover:text-[var(--color-brand-blue)] focus-visible:text-[var(--color-brand-blue)]",
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 group-aria-expanded:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="grid text-[var(--text-sm)] text-[var(--color-text-muted)] transition-[grid-template-rows,opacity] duration-200 data-open:grid-rows-[1fr] data-closed:grid-rows-[0fr] data-open:opacity-100 data-closed:opacity-0"
      {...props}
    >
      <div className={cn("overflow-hidden pb-4", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
