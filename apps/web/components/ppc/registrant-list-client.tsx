"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";

import type { AdminRegistrantSummary } from "@/lib/admin-registrants";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ppc/data-table";
import { LevelBadge } from "@/components/ppc/level-badge";
import { ProgressBar } from "@/components/ppc/progress-bar";
import { StatusBadge } from "@/components/ppc/status-badge";

type RegistrantListClientProps = {
  registrants: AdminRegistrantSummary[];
  basePath?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "None";
  }

  return value.slice(0, 10);
}

function accountStatusVariant(status: AdminRegistrantSummary["accountStatus"]) {
  return status === "ppc_account" ? "success" : "default";
}

function trackedStatus(value: "not_tracked" | "tracked") {
  return value === "not_tracked" ? "Not tracked" : value;
}

export function RegistrantListClient({
  registrants,
  basePath = "/admin",
}: RegistrantListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return registrants.filter((registrant) => {
      const matchesSearch =
        !q ||
        registrant.name.toLowerCase().includes(q) ||
        registrant.email.toLowerCase().includes(q);
      const matchesSource =
        sourceFilter === "all" ||
        registrant.sources.includes(sourceFilter as "ppc" | "welcome");
      const matchesAccount =
        accountFilter === "all" || registrant.accountStatus === accountFilter;

      return matchesSearch && matchesSource && matchesAccount;
    });
  }, [accountFilter, registrants, search, sourceFilter]);

  const columns: Column<AdminRegistrantSummary>[] = [
    {
      key: "name",
      label: "Registrant",
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            router.push(`${basePath}/students/${row.id}`);
          }}
          className="grid text-left text-xs underline-offset-2 hover:underline"
        >
          <span className="font-medium text-zinc-900">{row.name}</span>
          <span className="text-[11px] text-zinc-500">{row.email}</span>
        </button>
      ),
      className: "min-w-[190px]",
    },
    {
      key: "sourceLabel",
      label: "Source",
      sortable: true,
      render: (row) => (
        <div className="grid gap-1">
          <span className="text-xs text-zinc-700">{row.sourceLabel}</span>
          <StatusBadge
            status={row.accountStatus === "ppc_account" ? "PPC account" : "Welcome only"}
            variant={accountStatusVariant(row.accountStatus)}
          />
        </div>
      ),
    },
    {
      key: "ppc",
      label: "PPC progress",
      render: (row) =>
        row.ppc ? (
          <div className="grid min-w-[150px] gap-1">
            <div className="flex items-center gap-2">
              <LevelBadge level={row.ppc.currentLevel} />
              <span className="text-[11px] text-zinc-500">{row.ppc.currentLesson}</span>
            </div>
            <div className="flex items-center gap-2">
              <ProgressBar value={row.ppc.progressPercent} max={100} />
              <span className="w-7 text-right text-[10px] text-zinc-400">
                {row.ppc.progressPercent}%
              </span>
            </div>
          </div>
        ) : (
          <StatusBadge status="No PPC account" />
        ),
      className: "min-w-[180px]",
    },
    {
      key: "prayerWatch",
      label: "Devotion",
      render: (row) => (
        <div className="grid gap-0.5 text-xs">
          <span className="text-zinc-700">
            {row.prayerWatch.attendedDays} prayer day
            {row.prayerWatch.attendedDays === 1 ? "" : "s"}
          </span>
          <span className="text-[11px] text-zinc-400">
            Last: {formatDate(row.prayerWatch.lastAttendedDate)}
          </span>
        </div>
      ),
      className: "min-w-[130px]",
    },
    {
      key: "bibleReadingStatus",
      label: "Bible",
      render: (row) => <StatusBadge status={trackedStatus(row.bibleReadingStatus)} />,
    },
    {
      key: "podcastStatus",
      label: "Podcast",
      render: (row) =>
        row.podcastStatus === "tracked" ? (
          <div className="grid gap-0.5 text-xs">
            <span className="text-zinc-700">
              {row.podcast.listenedEpisodes} episode
              {row.podcast.listenedEpisodes === 1 ? "" : "s"}
            </span>
            <span className="text-[11px] text-zinc-400">
              Last: {formatDate(row.podcast.lastListenedAt)}
            </span>
          </div>
        ) : (
          <StatusBadge status={trackedStatus(row.podcastStatus)} />
        ),
      className: "min-w-[120px]",
    },
    {
      key: "createdAt",
      label: "Signup",
      sortable: true,
      render: (row) => <span className="text-xs text-zinc-500">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search registrants..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 w-full rounded-sm border border-zinc-200 bg-white pl-7 pr-3 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
          />
        </div>

        <div className="relative">
          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className={cn(
              "h-8 appearance-none rounded-sm border border-zinc-200 bg-white pl-3 pr-7 text-xs text-zinc-700 outline-none",
              "focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200",
            )}
          >
            <option value="all">All sources</option>
            <option value="ppc">PPC</option>
            <option value="welcome">Welcome</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-zinc-400" />
        </div>

        <div className="relative">
          <select
            value={accountFilter}
            onChange={(event) => setAccountFilter(event.target.value)}
            className={cn(
              "h-8 appearance-none rounded-sm border border-zinc-200 bg-white pl-3 pr-7 text-xs text-zinc-700 outline-none",
              "focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200",
            )}
          >
            <option value="all">All accounts</option>
            <option value="ppc_account">PPC accounts</option>
            <option value="welcome_only">Welcome only</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      <DataTable<AdminRegistrantSummary>
        columns={columns}
        data={filtered as (AdminRegistrantSummary & Record<string, unknown>)[]}
        onRowClick={(row) => router.push(`${basePath}/students/${row.id}`)}
        emptyMessage="No registrants found"
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
