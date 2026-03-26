"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dialogContentVariants = cva(
  "fixed top-1/2 left-1/2 z-50 grid w-[min(100%-1.5rem,34rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5 shadow-[var(--shadow-lg)] outline-none transition-[opacity,transform] duration-200 data-open:opacity-100 data-closed:opacity-0 data-open:scale-100 data-closed:scale-95 sm:p-6",
  {
    variants: {
      tone: {
        default: "bg-[var(--page-surface-raised)] text-[var(--color-text)]",
        muted: "bg-[var(--page-accent-surface)] text-[var(--color-text)]",
        questions: "theme-questions bg-[var(--page-accent-surface)] text-[var(--color-text)]",
        purpose: "theme-purpose bg-[var(--page-accent-surface)] text-[var(--color-text)]",
        fulfil: "theme-fulfil bg-[var(--page-accent-surface)] text-[var(--color-text)]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-[rgba(15,23,40,0.35)] backdrop-blur-[2px] transition-opacity duration-200 data-open:opacity-100 data-closed:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  tone,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean;
  }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(dialogContentVariants({ tone, className }))}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
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
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("grid gap-1.5 pr-10", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("mt-2 flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("h3 text-[var(--color-text-strong)]", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("body text-[var(--color-text-muted)]", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
