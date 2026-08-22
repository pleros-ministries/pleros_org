"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ppc/data-table";
import { LevelBadge } from "@/components/ppc/level-badge";
import { ProgressBar } from "@/components/ppc/progress-bar";
import { StatusBadge } from "@/components/ppc/status-badge";

type Student = {
  id: string;
  name: string;
  email: string;
  currentLevel: number;
  progressPercent: number;
  currentLesson: string;
  qaPending: number;
  reviewsPending: number;
  graduationStatus: string;
  location: string | null;
  createdAt: Date | string;
};

type StudentListClientProps = {
  students: Student[];
  basePath?: string;
};

export function StudentListClient({
  students,
  basePath = "/ppc",
}: StudentListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const matchesSearch =
        !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchesLevel =
        levelFilter === "all" || s.currentLevel === Number(levelFilter);
      return matchesSearch && matchesLevel;
    });
  }, [students, search, levelFilter]);

  const columns: Column<Student>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`${basePath}/students/${row.id}`);
          }}
          className="text-xs font-medium text-zinc-900 underline-offset-2 hover:underline"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "currentLevel",
      label: "Level",
      sortable: true,
      render: (row) => <LevelBadge level={row.currentLevel} />,
    },
    {
      key: "progressPercent",
      label: "Progress",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={row.progressPercent} max={100} />
          <span className="text-[10px] text-zinc-400">{row.progressPercent}%</span>
        </div>
      ),
      className: "min-w-[120px]",
    },
    {
      key: "currentLesson",
      label: "Current lesson",
      sortable: true,
    },
    {
      key: "graduationStatus",
      label: "Status",
      render: (row) => {
        const variant =
          row.graduationStatus === "graduated"
            ? "success"
            : row.graduationStatus === "at_risk"
              ? "warning"
              : "default";
        return <StatusBadge status={row.graduationStatus} variant={variant} />;
      },
    },
  ];

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-sm border border-zinc-200 bg-white pl-7 pr-3 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
          />
        </div>

        <div className="relative">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className={cn(
              "h-8 appearance-none rounded-sm border border-zinc-200 bg-white pl-3 pr-7 text-xs text-zinc-700 outline-none",
              "focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200",
            )}
          >
            <option value="all">All levels</option>
            {[1, 2, 3, 4, 5].map((l) => (
              <option key={l} value={String(l)}>
                Level {l}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      <DataTable<Student>
        columns={columns}
        data={filtered as (Student & Record<string, unknown>)[]}
        onRowClick={(row) => router.push(`${basePath}/students/${row.id}`)}
        emptyMessage="No students found"
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
