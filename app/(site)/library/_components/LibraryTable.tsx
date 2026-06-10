"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { DownloadIcon } from "lucide-react";

import type { Teaching } from "@/lib/db/queries/teachings";
import { usePlayer } from "./PlayerContext";
import { LibrarySidebar } from "./LibrarySidebar";
import { PlayerBar } from "./PlayerBar";
import { getSeriesEmoji } from "./series-config";

type SortMode = "default" | "title" | "series";

type Props = {
  teachings: Teaching[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasAudio(t: Teaching) {
  return Boolean(t.audioUrl && t.audioUrl !== "" && !t.audioUrl.startsWith("placeholder"));
}

function PauseIcon() {
  return (
    <svg className="size-3.5 fill-white" viewBox="0 0 24 24" aria-hidden>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

// ─── Teaching table row ───────────────────────────────────────────────────────

type RowProps = {
  teaching: Teaching;
  isActive: boolean;
  isThisPlaying: boolean;
  onPlay: () => void;
};

function TeachingRow({
  teaching,
  isActive,
  isThisPlaying,
  onPlay,
}: RowProps) {
  const canPlay = hasAudio(teaching);
  const year = teaching.date?.split(" ").at(-1) ?? "—";

  return (
    <tr
      className={`group border-b transition-colors duration-100 ${isActive
          ? "border-[#1a2f8a] bg-[#0d1b5e]"
          : "cursor-pointer border-[#e8e8ee] hover:bg-[#f9f9fb]"
        }`}
      style={{ height: 52 }}
      onClick={() => canPlay && onPlay()}
    >
      {/* S/N */}
      <td
        className={`w-12 px-3 text-center text-[12px] font-[500] tabular-nums ${isActive ? "text-white/40" : "text-[#8888a0]"
          }`}
      >
        {teaching.sn}
      </td>

      {/* Teaching: play button + title */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label={isThisPlaying ? "Pause" : "Play"}
            onClick={(e) => {
              e.stopPropagation();
              if (canPlay) {
                onPlay();
              }
            }}
            disabled={!canPlay}
            className={`row-play flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${isActive
                ? "bg-[#60a5fa] text-white opacity-100"
                : canPlay
                  ? "bg-[#2563eb] text-white opacity-50 group-hover:opacity-100"
                  : "cursor-not-allowed bg-[#e8e8ee] text-[#8888a0] opacity-30"
              }`}
          >
            {isThisPlaying ? (
              <PauseIcon />
            ) : (
              <svg
                className="size-3.5 fill-current"
                viewBox="0 0 16 16"
                aria-hidden
              >
                <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11Z" />
              </svg>
            )}
          </button>
          <span
            className={`font-[var(--font-sen)] text-[13px] font-[600] leading-snug ${isActive ? "text-white" : "text-[#111118]"
              }`}
          >
            {teaching.title}
          </span>
        </div>
      </td>

      {/* Series tag — hidden on mobile */}
      <td className="hidden w-40 px-3 md:table-cell">
        <span
          className={`inline-block whitespace-nowrap rounded-full border-[1.5px] px-2.5 py-[3px] text-[11px] font-[600] ${isActive
              ? "border-white/20 text-white/50"
              : "border-[#d4d4de] text-[#444450]"
            }`}
        >
          {teaching.series}
        </span>
      </td>

      {/* Year — hidden on mobile */}
      <td
        className={`hidden w-[68px] px-3 text-center text-[12px] font-[600] tabular-nums md:table-cell ${isActive ? "text-white/40" : "text-[#8888a0]"
          }`}
      >
        {year}
      </td>

      {/* Download */}
      <td
        className="w-11 px-1.5 text-right md:w-[120px] md:px-3"
        onClick={(e) => e.stopPropagation()}
      >
        {canPlay ? (
          <a
            href={teaching.audioUrl}
            download={`${teaching.title}.mp3`}
            aria-label={`Download ${teaching.title}`}
            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border-[1.5px] p-1.5 text-[11px] font-[600] transition-all md:px-3 md:py-1.5 ${isActive
                ? "border-white/20 text-white/50 hover:border-[#60a5fa] hover:text-[#60a5fa]"
                : "border-[#d4d4de] text-[#444450] hover:border-[var(--color-brand-blue)] hover:bg-[var(--color-brand-sky-soft)] hover:text-[var(--color-brand-blue)]"
              }`}
          >
            <DownloadIcon className="h-[11px] w-[11px] shrink-0" />
            <span className="hidden md:inline">Download</span>
          </a>
        ) : (
          <span className="text-[11px] text-[#8888a0] opacity-50">Soon</span>
        )}
      </td>
    </tr>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export function LibraryTable({ teachings }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSeries, setActiveSeries] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const { currentTrack, isPlaying, playTeaching, setFlatList } = usePlayer();

  // Unique series (preserving order from DB)
  const allSeries = useMemo(() => {
    const seen = new Set<string>();
    return teachings.filter((t) => {
      if (seen.has(t.series)) return false;
      seen.add(t.series);
      return true;
    }).map((t) => t.series);
  }, [teachings]);

  // Count per series (original dataset)
  const seriesCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of teachings) m.set(t.series, (m.get(t.series) ?? 0) + 1);
    return m;
  }, [teachings]);

  // Filter
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return teachings.filter((t) => {
      const matchSeries = activeSeries === "all" || t.series === activeSeries;
      const matchSearch =
        q === "" || t.title.toLowerCase().includes(q) || t.series.toLowerCase().includes(q);
      return matchSeries && matchSearch;
    });
  }, [teachings, activeSeries, searchQuery]);

  // Sort → flat list
  const sortedFlat = useMemo(() => {
    if (sortMode === "title") return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === "series")
      return [...filtered].sort((a, b) => a.series.localeCompare(b.series) || a.sn - b.sn);
    return filtered;
  }, [filtered, sortMode]);

  // Groups (for default + series sort)
  const grouped = useMemo(() => {
    if (sortMode === "title") return null;
    const groups: { series: string; items: Teaching[] }[] = [];
    const m = new Map<string, Teaching[]>();
    for (const t of sortedFlat) {
      if (!m.has(t.series)) m.set(t.series, []);
      m.get(t.series)!.push(t);
    }
    for (const [series, items] of m) groups.push({ series, items });
    return groups;
  }, [sortedFlat, sortMode]);

  const flatFiltered = useMemo(
    () => (grouped ? grouped.flatMap((g) => g.items) : sortedFlat),
    [grouped, sortedFlat],
  );

  // Keep context's flatList in sync for prev/next navigation
  useEffect(() => {
    setFlatList(flatFiltered);
  }, [flatFiltered, setFlatList]);

  const totalCount = teachings.length;
  const filteredCount = flatFiltered.length;
  const isFiltered = filteredCount < totalCount;

  return (
    <>
      <LibrarySidebar teachings={teachings} sortMode={sortMode} setSortMode={setSortMode} />

      <div className="min-w-0 flex-1 pb-32 font-[var(--font-be-vietnam-pro)]">
        {/* ── Page header ── */}
        <div className="border-b border-[#e8e8ee] bg-white px-5 pb-5 pt-8 md:px-9 md:pt-9">
          <h1 className="site-hero-heading text-[2rem] text-[var(--color-brand-indigo)] sm:text-[2.4rem] md:text-[2.8rem] xl:text-[3.2rem]">
            The Pleros Library
          </h1>
          <p className="mt-3 max-w-[34rem] text-[1rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)] md:text-[1.0625rem]">
            Teachings on Faith, Purpose, Redemption, and New Creation — click any
            teaching to play it, or download for offline listening.
          </p>

          {/* Search + tabs */}
          <div className="mt-5 flex flex-col gap-3">
            <p className="text-[12px] font-[600] text-[var(--color-text-muted)]">
              {isFiltered
                ? `${filteredCount} of ${totalCount} teachings`
                : `${totalCount} teachings`}
            </p>

            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8888a0]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teachings or series…"
                className="h-10 w-full rounded-xl border-[1.5px] border-[#e8e8ee] bg-[#f9f9fb] pl-10 pr-4 text-[13px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] outline-none transition-all focus:border-[var(--color-brand-blue)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(5,20,128,0.1)]"
              />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {["all", ...allSeries].map((s) => {
                const active = activeSeries === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveSeries(s)}
                    className={`h-9 rounded-full border-[1.5px] px-3.5 text-[12px] font-[600] transition-all ${active
                        ? "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] text-white"
                        : "border-[#e8e8ee] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-brand-blue)] hover:bg-[var(--color-brand-sky-soft)] hover:text-[var(--color-brand-blue)]"
                      }`}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="px-5 md:px-9">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#d4d4de]">
                {[
                  { label: "#", cls: "w-12 text-center" },
                  { label: "Teaching", cls: "" },
                  { label: "Series", cls: "w-40 hidden md:table-cell" },
                  { label: "Year", cls: "w-[68px] text-center hidden md:table-cell" },
                  { label: "", cls: "w-11 text-right md:w-[120px]" },
                ].map(({ label, cls }, i) => (
                  <th
                    key={i}
                    className={`bg-[#f9f9fb] px-3 py-3.5 font-[var(--font-sen)] text-[10px] font-[700] uppercase tracking-[1.5px] text-[#8888a0] ${cls}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flatFiltered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-9 py-16 text-center text-[13px] text-[#8888a0]">
                    No teachings found
                  </td>
                </tr>
              ) : grouped ? (
                grouped.map(({ series, items }) => (
                  <Fragment key={series}>
                    {/* Series group header */}
                    <tr className="border-b border-[#e8e8ee] border-t-2 border-t-[#d4d4de]">
                      <td
                        colSpan={5}
                        className="bg-[#f9f9fb] px-3 py-2.5 font-[var(--font-sen)] text-[10px] font-[800] uppercase tracking-[2px] text-[#0d1b5e]"
                      >
                        {getSeriesEmoji(series)} {series}
                        <span className="ml-2 rounded-full bg-[#e8e8ee] px-1.5 py-[1px] text-[10px] font-[600] normal-case tracking-normal text-[#8888a0]">
                          {seriesCounts.get(series) ?? 0}
                        </span>
                      </td>
                    </tr>

                    {items.map((t) => (
                      <TeachingRow
                        key={t.id}
                        teaching={t}
                        isActive={currentTrack?.id === t.id}
                        isThisPlaying={currentTrack?.id === t.id && isPlaying}
                        onPlay={() => playTeaching(t)}
                      />
                    ))}
                  </Fragment>
                ))
              ) : (
                sortedFlat.map((t) => (
                  <TeachingRow
                    key={t.id}
                    teaching={t}
                    isActive={currentTrack?.id === t.id}
                    isThisPlaying={currentTrack?.id === t.id && isPlaying}
                    onPlay={() => playTeaching(t)}
                  />
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>

      <PlayerBar />
    </>
  );
}
