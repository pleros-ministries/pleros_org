import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  title,
  subtitle,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        "grid gap-2",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <h2 className="h2 text-[var(--color-text-strong)]">{title}</h2>
      {subtitle ? (
        <p className="body text-[var(--color-text-muted)]">{subtitle}</p>
      ) : null}
    </header>
  );
}
