"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sheetSideVariants = cva(
  "fixed z-50 flex flex-col gap-4 border border-[var(--color-line)] bg-[var(--page-surface-raised)] p-5 shadow-[var(--shadow-lg)] transition-[opacity,transform] duration-200 ease-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 rounded-b-[var(--radius-lg)] data-open:translate-y-0 data-closed:-translate-y-8 data-open:opacity-100 data-closed:opacity-0",
        right:
          "inset-y-0 right-0 h-full w-[min(100%,24rem)] rounded-l-[var(--radius-lg)] data-open:translate-x-0 data-closed:translate-x-8 data-open:opacity-100 data-closed:opacity-0",
        bottom:
          "inset-x-0 bottom-0 rounded-t-[var(--radius-lg)] data-open:translate-y-0 data-closed:translate-y-8 data-open:opacity-100 data-closed:opacity-0",
        left:
          "inset-y-0 left-0 h-full w-[min(100%,24rem)] rounded-r-[var(--radius-lg)] data-open:translate-x-0 data-closed:-translate-x-8 data-open:opacity-100 data-closed:opacity-0",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(props: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-[rgba(15,23,40,0.36)] backdrop-blur-[2px] transition-opacity duration-200 data-open:opacity-100 data-closed:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side,
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props &
  VariantProps<typeof sheetSideVariants> & {
    showCloseButton?: boolean;
  }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(sheetSideVariants({ side, className }))}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("grid gap-1.5 pr-10", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto grid gap-2", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("h3 text-[var(--color-text-strong)]", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("body text-[var(--color-text-muted)]", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
