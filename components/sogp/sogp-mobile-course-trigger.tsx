import { forwardRef, type ComponentProps } from "react";
import { MenuIcon } from "lucide-react";

export const SogpMobileCourseTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button">
>(function SogpMobileCourseTrigger(
  { className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      {...props}
      type="button"
      aria-label={props["aria-label"] ?? "Open course menu"}
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-brand-blue)] bg-white px-4 text-sm font-semibold text-[var(--color-brand-blue)] active:scale-[0.96] lg:hidden ${className}`}
    >
      <MenuIcon className="size-4" strokeWidth={2} />
      Course menu
    </button>
  );
});
