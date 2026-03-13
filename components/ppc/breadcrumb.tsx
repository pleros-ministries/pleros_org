import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-zinc-500">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3 text-zinc-300" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-zinc-900 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-zinc-900" : ""}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
