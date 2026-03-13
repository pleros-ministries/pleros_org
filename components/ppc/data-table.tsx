"use client";

import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  getRowKey?: (row: T) => string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data",
  getRowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  if (sorted.length === 0) {
    return (
      <div className="rounded border border-zinc-200 bg-white px-4 py-8 text-center text-xs text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-zinc-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400",
                  col.sortable && "cursor-pointer select-none hover:text-zinc-600",
                  col.className,
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    sortKey === col.key ? (
                      sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                    ) : (
                      <ArrowUpDown className="size-3 opacity-30" />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={getRowKey ? getRowKey(row) : i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-zinc-50 last:border-0",
                onRowClick && "cursor-pointer hover:bg-zinc-50",
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-3 py-2 text-sm text-zinc-700", col.className)}>
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
