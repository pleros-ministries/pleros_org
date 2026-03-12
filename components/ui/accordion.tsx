"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
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

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "surface-card overflow-hidden border-[var(--color-line)] px-4",
        className,
      )}
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
