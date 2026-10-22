"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";

import groupStyles from "@/components/community/discipleship/discipleship-group.module.css";
import { sheetStyles as sheet } from "@/components/community/report/report-sheet";
import { dedupeEpisodes, normaliseEpisodeText, searchEpisodes } from "@/lib/podcast-episode-search";

/**
 * The two pages "What's next" opens to pick episodes (Pastor, 21 October; the
 * user added your own journey the same day). Long lists show eight at a time
 * with a search box, names only. Saving starts Day 1 today and returns to
 * Learning; a failed save keeps everything picked and says what to do.
 */

const PAGE = 8;
const FAILED = "Couldn’t save that. Check your connection and try again.";

export type SeriesChoice = { id: string; title: string; description: string | null; episodes: number; listened: number; current: boolean };

function Search({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <label className="relative block">
    <span className="sr-only">{label}</span>
    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--color-text-muted)" aria-hidden="true" />
    <input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={label}
      className="h-10 w-full rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white pr-3 pl-9 text-[16px] outline-none placeholder:text-[14px] placeholder:text-(--color-text-muted) focus:border-[var(--color-community-blue)]" />
  </label>;
}

function Radio({ on }: { on: boolean }) {
  return <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]" style={{ borderColor: on ? "var(--color-community-blue)" : "#c9ced6", background: on ? "var(--color-community-blue)" : "transparent" }} aria-hidden="true">
    {on ? <CheckIcon className="size-3 text-white" strokeWidth={3} /> : null}
  </span>;
}

export function SeriesPicker({ series, preview = false }: { series: SeriesChoice[]; preview?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [choice, setChoice] = useState<string | null>(series.find(item => item.current)?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const phrase = normaliseEpisodeText(query);
  const matches = phrase ? series.filter(item => phrase.split(" ").every(word => normaliseEpisodeText(item.title).includes(word))) : series;
  const picked = series.find(item => item.id === choice) ?? null;

  const start = () => {
    if (!picked || preview) return;
    setError(null);
    startTransition(async () => {
      const { chooseNextLearningAction } = await import("@/app/(site)/dashboard/sogp/next/_actions");
      const result = await chooseNextLearningAction({ kind: "series", seriesId: picked.id }).catch(() => ({ ok: false as const, error: FAILED }));
      if (result.ok) router.push("/dashboard/sogp");
      else setError(result.error);
    });
  };

  return <div className="grid gap-3.5">
    <div><h1>Choose a series</h1><p className={groupStyles.sub}>One episode a day from Part 1. Missed days wait for you</p></div>
    <Search value={query} onChange={value => { setQuery(value); setShown(PAGE); }} label="Search series" />
    <div className={groupStyles.panel}>
      {matches.length ? <ul className={groupStyles.list} role="radiogroup" aria-label="Series">
        {matches.slice(0, shown).map(item => <li key={item.id}>
          <button type="button" role="radio" aria-checked={choice === item.id} onClick={() => setChoice(item.id)}
            className={`${groupStyles.row} w-full items-start text-left`} style={choice === item.id ? { background: "#f6f8fe" } : undefined}>
            <span className={`${groupStyles.rowCopy} gap-0.5`}>
              <span className={groupStyles.rowTitle} style={{ whiteSpace: "normal" }}>{item.title}{item.current ? <span className="ml-1.5 inline-block h-5 rounded-full bg-[#eceef2] px-2 align-[1px] text-[11px] font-medium leading-5 text-(--color-text-muted)">Current</span> : null}</span>
              {item.description ? <span className={`${groupStyles.rowMeta} line-clamp-2`} style={{ whiteSpace: "normal" }}>{item.description}</span> : null}
              <span className={groupStyles.rowMeta}>{item.episodes} {item.episodes === 1 ? "day" : "days"}{item.listened ? ` · ${item.listened} listened` : ""}</span>
            </span>
            <Radio on={choice === item.id} />
          </button>
        </li>)}
      </ul> : <p className={`${groupStyles.empty} m-0`}>No series match “{query.trim()}”.</p>}
    </div>
    {matches.length > shown ? <button type="button" className={`${groupStyles.quiet} justify-self-center`} onClick={() => setShown(count => count + PAGE)}>Show more</button> : null}
    {error ? <p role="alert" className={sheet.error}>{error}</p> : null}
    <button type="button" className={`${groupStyles.btn} h-[38px] justify-self-stretch text-[13.5px]`} data-primary disabled={!picked || pending} onClick={start}>
      {pending ? "Starting…" : picked ? `Start ${picked.title}` : "Choose a series"}
    </button>
  </div>;
}

export type JourneyEpisode = { guid: string; title: string; duration: string };

export function OwnJourneyBuilder({ episodes, initial, max, preview = false }: { episodes: JourneyEpisode[]; initial: string[]; max: number; preview?: boolean }) {
  const router = useRouter();
  const catalogue = useMemo(() => dedupeEpisodes(episodes), [episodes]);
  const byGuid = useMemo(() => new Map(catalogue.map(episode => [episode.guid, episode] as const)), [catalogue]);
  const [picked, setPicked] = useState<string[]>(() => initial.filter(guid => byGuid.has(guid)));
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const chosen = new Set(picked);
  // Newest first until you search; a search ranks full matches first.
  const results = (query.trim() ? searchEpisodes(catalogue, query, 60) : catalogue);
  const full = picked.length >= max;

  const toggle = (guid: string) => setPicked(list => list.includes(guid) ? list.filter(item => item !== guid) : list.length >= max ? list : [...list, guid]);
  const move = (index: number, by: -1 | 1) => setPicked(list => {
    const next = [...list], to = index + by;
    if (to < 0 || to >= next.length) return list;
    [next[index], next[to]] = [next[to]!, next[index]!];
    return next;
  });

  const save = () => {
    if (!picked.length || preview) return;
    setError(null);
    startTransition(async () => {
      const { saveOwnJourneyAction } = await import("@/app/(site)/dashboard/sogp/next/_actions");
      const result = await saveOwnJourneyAction(picked).catch(() => ({ ok: false as const, error: FAILED }));
      if (result.ok) router.push("/dashboard/sogp");
      else setError(result.error);
    });
  };

  return <div className="grid gap-3.5">
    <div><h1>Your own journey</h1><p className={groupStyles.sub}>Pick the episodes you want. You’ll hear one a day, in this order</p></div>

    <div className={groupStyles.sectionTitle}><h2>Your journey</h2><span className="text-[12.5px] text-(--color-text-muted) tabular-nums">{picked.length ? `${picked.length} ${picked.length === 1 ? "day" : "days"}` : null}</span></div>
    <div className={groupStyles.panel}>
      {picked.length ? <ol className={groupStyles.list} aria-label="Your journey, in order">
        {picked.map((guid, index) => {
          const episode = byGuid.get(guid)!;
          return <li key={guid} className={`${groupStyles.row} items-center`}>
            <span className="w-11 shrink-0 whitespace-nowrap text-[12px] text-(--color-text-muted) tabular-nums">Day {index + 1}</span>
            <span className={groupStyles.rowCopy}><span className={groupStyles.rowTitle} style={{ whiteSpace: "normal" }}>{episode.title}</span></span>
            <span className="flex shrink-0 items-center">
              <button type="button" className="grid size-9 place-items-center rounded-[10px] text-(--color-text-muted) disabled:opacity-30" aria-label={`Move ${episode.title} earlier`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUpIcon className="size-4" /></button>
              <button type="button" className="grid size-9 place-items-center rounded-[10px] text-(--color-text-muted) disabled:opacity-30" aria-label={`Move ${episode.title} later`} disabled={index === picked.length - 1} onClick={() => move(index, 1)}><ArrowDownIcon className="size-4" /></button>
              <button type="button" className="grid size-9 place-items-center rounded-[10px] text-(--color-text-muted)" aria-label={`Remove ${episode.title}`} onClick={() => toggle(guid)}><XIcon className="size-4" /></button>
            </span>
          </li>;
        })}
      </ol> : <p className={`${groupStyles.empty} m-0`}>No episodes yet. Add them from the list below, in the order you want to hear them.</p>}
    </div>
    {error ? <p role="alert" className={sheet.error}>{error}</p> : null}
    <button type="button" className={`${groupStyles.btn} h-[38px] justify-self-stretch text-[13.5px]`} data-primary disabled={!picked.length || pending} onClick={save}>
      {pending ? "Starting…" : picked.length ? `Start your journey · ${picked.length} ${picked.length === 1 ? "day" : "days"}` : "Add episodes to start"}
    </button>

    <div className={groupStyles.sectionTitle}><h2>Add episodes</h2></div>
    <Search value={query} onChange={value => { setQuery(value); setShown(PAGE); }} label="Search episodes" />
    {full ? <p className={groupStyles.note}>Your journey is full at {max} episodes. Remove one to add another.</p> : null}
    <div className={groupStyles.panel}>
      {results.length ? <ul className={groupStyles.list}>
        {results.slice(0, shown).map(episode => {
          const on = chosen.has(episode.guid);
          return <li key={episode.guid} className={`${groupStyles.row} items-center`}>
            <span className={groupStyles.rowCopy}>
              <span className={groupStyles.rowTitle} style={{ whiteSpace: "normal" }}>{episode.title}</span>
              {episode.duration ? <span className={groupStyles.rowMeta}>{episode.duration.replace(/^00:/, "")}</span> : null}
            </span>
            <button type="button" className={`${groupStyles.btn} shrink-0`} aria-pressed={on} disabled={!on && full} onClick={() => toggle(episode.guid)}>
              {on ? <><CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />Added</> : <><PlusIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />Add</>}
            </button>
          </li>;
        })}
      </ul> : <p className={`${groupStyles.empty} m-0`}>No episodes match “{query.trim()}”.</p>}
    </div>
    {results.length > shown ? <button type="button" className={`${groupStyles.quiet} justify-self-center`} onClick={() => setShown(count => count + PAGE)}>Show more</button> : null}
  </div>;
}
