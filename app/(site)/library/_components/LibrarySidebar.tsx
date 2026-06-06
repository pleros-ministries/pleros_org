"use client";

import Image from "next/image";

import type { Teaching } from "@/lib/db/queries/teachings";
import { usePlayer } from "./PlayerContext";

type SortMode = "default" | "title" | "series";

type Props = {
  teachings: Teaching[];
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
};

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#e8e8ee] bg-[#f1f1f5] p-3">
      <div className="text-[22px] font-[800] leading-none tracking-tight text-[#0d1b5e]">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-[500] uppercase tracking-[0.5px] text-[#8888a0]">
        {label}
      </div>
    </div>
  );
}

// ─── Sort button ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { mode: SortMode; label: string; icon: string }[] = [
  { mode: "default", label: "Default", icon: "≡" },
  { mode: "title", label: "Title A–Z", icon: "A" },
  { mode: "series", label: "By Series", icon: "#" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export function LibrarySidebar({ teachings, sortMode, setSortMode }: Props) {
  const { currentTrack, playTeaching } = usePlayer();

  const stats = {
    total: teachings.length,
    seriesCount: new Set(teachings.map((t) => t.series)).size,
    in2025: teachings.filter((t) => t.date?.includes("2025")).length,
    in2024: teachings.filter((t) => t.date?.includes("2024")).length,
  };

  const hasAudio = (t: Teaching) =>
    Boolean(t.audioUrl && t.audioUrl !== "" && !t.audioUrl.startsWith("placeholder"));

  const recentTeachings = [...teachings]
    .filter((t) => t.date)
    .sort((a, b) => b.sn - a.sn)
    .slice(0, 6);

  return (
    <aside
      className="sticky top-[4.25rem] hidden h-[calc(100vh-4.25rem)] w-[248px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-[#e8e8ee] bg-white px-5 py-5 md:flex"
      style={{ fontFamily: "var(--font-figtree, sans-serif)" }}
    >
      {/* ── Overview ── */}
      <div>
        <p className="mb-3 text-[10px] font-[700] uppercase tracking-[1.5px] text-[#8888a0]">
          Overview
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Teachings" value={stats.total} />
          <StatCard label="Series" value={stats.seriesCount} />
          <StatCard label="In 2025" value={stats.in2025} />
          <StatCard label="In 2024" value={stats.in2024} />
        </div>
      </div>

      <div className="h-px bg-[#e8e8ee]" />

      {/* ── Sort by ── */}
      <div>
        <p className="mb-2 text-[10px] font-[700] uppercase tracking-[1.5px] text-[#8888a0]">
          Sort by
        </p>
        <div className="flex flex-col gap-0.5">
          {SORT_OPTIONS.map(({ mode, label, icon }) => {
            const active = sortMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-[500] transition-colors ${
                  active
                    ? "bg-[#eff4ff] text-[#2563eb]"
                    : "text-[#444450] hover:bg-[#f1f1f5]"
                }`}
              >
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] text-[10px] ${
                    active ? "bg-[#2563eb] text-white" : "bg-[#e8e8ee] text-[#444450]"
                  }`}
                >
                  {icon}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[#e8e8ee]" />

      {/* ── Recently Added ── */}
      <div className="min-h-0 flex-1">
        <p className="mb-2 text-[10px] font-[700] uppercase tracking-[1.5px] text-[#8888a0]">
          Recently Added
        </p>
        <div className="flex flex-col gap-0.5">
          {recentTeachings.map((t) => {
            const active = currentTrack?.id === t.id;
            const canPlay = hasAudio(t);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => canPlay && playTeaching(t)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active ? "bg-[#0d1b5e]" : canPlay ? "hover:bg-[#f1f1f5]" : "opacity-60"
                }`}
              >
                {/* Teaching thumbnail */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#011585] p-1.5">
                  <Image
                    src="/site/home/assets/pleros-wordmark.png"
                    alt="Pleros"
                    width={36}
                    height={36}
                    className="h-auto w-full object-contain"
                  />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate text-[12px] font-[600] ${
                      active ? "text-white" : "text-[#111118]"
                    }`}
                  >
                    {t.title}
                  </span>
                  <span
                    className={`block truncate text-[11px] ${
                      active ? "text-white/60" : "text-[#8888a0]"
                    }`}
                  >
                    {t.series}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
