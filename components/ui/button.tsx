"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant,
  size,
  render,
  nativeButton,
  ...props
}: ButtonProps) {
  const resolvedNativeButton =
    nativeButton ??
    (render && !React.isValidElement(render)
      ? true
      : render
        ? render.type === "button"
        : true);

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={render}
      nativeButton={resolvedNativeButton}
      {...props}
    />
  );
}

export { Button, buttonVariants };
