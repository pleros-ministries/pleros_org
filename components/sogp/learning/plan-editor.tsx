"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { chooseSogpPathAction, editSogpPlanAction } from "@/app/_actions/sogp-learning-actions";
import { moveRemainingEpisode, podcastSuggestion, learningWriteNotice, type LearningViewData } from "@/lib/sogp/learning-view";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import styles from "./learning.module.css";
import { PlanPreviewStep, SuggestedTracklistStep, TracklistReadyStep } from "./plan-onboarding";

export function PlanEditor({ data,requestedPath }: { data: LearningViewData;requestedPath?: "podcast_one" | "podcast_two" }) {
  const router = useRouter();
  const query = useQueryClient();
  const [base] = useState(() => ({ revision: data.state?.revision ?? 0,guids: [...(data.state?.plan?.episodeGuids ?? [])] }));
  const pace = data.state?.plan?.episodesPerDay ?? (requestedPath === "podcast_two" ? 2 : 1);
  const existingPlan = data.state?.plan !== null && data.state?.plan !== undefined;
  // A first podcast plan starts from the optional Purpose suggestion (Paper onboarding steps).
  const [suggested] = useState(() => existingPlan ? [] : podcastSuggestion(data.episodes,pace));
  const [stage,setStage] = useState<"preview" | "suggested" | "edit" | "ready">(() => existingPlan || !suggested.length ? "edit" : "preview");
  const [draft,setDraft] = useState<string[]>(() => existingPlan ? base.guids : suggested);
  const [search,setSearch] = useState("");
  const [planSearch,setPlanSearch] = useState("");
  const [filter,setFilter] = useState("all");
  const [editingSlot,setEditingSlot] = useState<string | null>(null);
  const [showLibrary,setShowLibrary] = useState(() => !existingPlan && !suggested.length);
  const [error,setError] = useState<string | null>(null);
  const [saving,startSave] = useTransition();
  const dirty = existingPlan && JSON.stringify(base.guids) !== JSON.stringify(draft);
  const listened = new Set(data.state?.progress.listenedEpisodeGuids ?? []);
  const archived = new Set(data.state?.plan?.historyEpisodeGuids ?? []);
  const episodes = new Map(data.episodes.map(episode => [episode.guid,episode]));
  const queued = new Set(draft);
  const positions = new Map(data.state?.progress.playbackPositions.map(position => [position.episodeGuid,position]) ?? []);
  const dayNumbers = Array.from({ length: Math.ceil(draft.length / pace) },(_,index) => index + 1);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault();event.returnValue = ""; };
    window.addEventListener("beforeunload",warn);
    const beforeNavigation = (event: Event) => { if (!window.confirm("Leave without saving your plan changes?")) event.preventDefault(); };
    window.addEventListener("pleros:learning-navigation",beforeNavigation);
    return () => { window.removeEventListener("beforeunload",warn);window.removeEventListener("pleros:learning-navigation",beforeNavigation); };
  },[dirty]);
  function remove(index: number) {
    if (draft.slice(index).some(guid => listened.has(guid))) { setError("Removing this slot would move a completed episode. Replace its episode instead.");return; }
    setDraft(draft.filter((_,position) => position !== index));setError(null);
  }
  function save(startDayOne = false) {
    if (!existingPlan && !draft.length) { setError("Choose at least one episode to start your plan.");return; }
    startSave(async () => {
      try {
        const result = existingPlan ? await editSogpPlanAction({ expectedRevision: base.revision,episodeGuids: draft }) : await chooseSogpPathAction({ expectedRevision: base.revision,path: requestedPath ?? "podcast_one",episodeGuids: draft });
        if (!result.ok) { setError(result.error);return; }
        query.setQueryData<LearningViewData>(["sogp","learning-v3"],old => ({ ...(old ?? data),state: result.value }));
        router.push(startDayOne ? "/dashboard/sogp/listen?day=1" : "/dashboard/sogp");router.refresh();
      } catch { setError("Your plan could not be saved. Your draft is still here; try again."); }
    });
  }
  const episodeMap = new Map(data.episodes.map(episode => [episode.guid,episode]));
  if (stage === "preview") return <PlanPreviewStep pace={pace} guids={draft} episodes={episodeMap} onNext={() => setStage("suggested")} />;
  if (stage === "suggested") return <SuggestedTracklistStep pace={pace} guids={draft} episodes={episodeMap} onUse={() => setStage("ready")} onEdit={() => { setShowLibrary(false);setStage("edit"); }} />;
  if (stage === "ready") return <TracklistReadyStep pace={pace} guids={draft} episodes={episodeMap} saving={saving} canWrite={data.canWrite} error={error ?? (!data.canWrite ? learningWriteNotice(data) : null)} onEdit={() => { setShowLibrary(false);setStage("edit"); }} onStart={() => save(true)} />;
  const library = data.episodes.filter(episode => (!search || episode.title.toLowerCase().includes(search.toLowerCase())) && (filter === "all" || episode.title.toLowerCase().includes(filter)));
  return <section className={styles.page}>
    <header className={styles.header}><p className={styles.eyebrow}>{showLibrary ? "Build your plan" : `Podcast · ${pace === 2 ? "30" : "15"} min/day`}</p><h1>{showLibrary ? "Choose your episodes" : "Make the plan yours"}</h1><p className={styles.muted}>{showLibrary ? "Browse the library or use a suggested start. You can choose any available episodes." : "Reorder or replace remaining episodes. Completed episodes stay in your history."}</p></header>
    {!showLibrary ? <>
    <div className={styles.notice}><h2>All {dayNumbers.length} {dayNumbers.length === 1 ? "day" : "days"} · {draft.length} episodes</h2><div className={styles.metaRow}><p className={styles.meta}>{draft.filter(guid => listened.has(guid)).length} listened · {draft.filter(guid => !listened.has(guid)).length} remaining</p><Link href="/dashboard/sogp/path" onClick={event => { if (dirty && !window.confirm("Leave without saving your plan changes?")) event.preventDefault(); }}>Switch path</Link></div>{archived.size ? <p className={styles.meta}>{archived.size} episodes in retained history</p> : null}</div>
    <label className={styles.planSearch}><span className="sr-only">Find any episode in this plan</span><DashboardIcon name="search" /><input type="search" placeholder="Find any episode in this plan" value={planSearch} onChange={event => setPlanSearch(event.target.value)} /></label>
    <label className={styles.stack}>Jump to day<select defaultValue="" onChange={event => { const day = event.target.value;setPlanSearch("");requestAnimationFrame(() => document.getElementById(`learning-day-${day}`)?.scrollIntoView({ behavior: "instant",block: "start" })); }}><option value="" disabled>Choose a day</option>{dayNumbers.map(day => <option key={`day-${day}`} value={day}>Day {day}</option>)}</select></label>
    <div className={styles.stack}>
      {!draft.length ? <p className={styles.muted}>No episodes selected. Browse the library below or add the optional suggestion.</p> : null}
      {planSearch && !draft.some(guid => (episodes.get(guid)?.title ?? "Episode no longer in the catalogue").toLowerCase().includes(planSearch.toLowerCase())) ? <p className={styles.muted}>No episodes in your plan match this search.</p> : null}
      {draft.map((guid,index) => {
        const episode = episodes.get(guid), title = episode?.title ?? "Episode no longer in the catalogue", locked = listened.has(guid), position = positions.get(guid);
        if (planSearch && !title.toLowerCase().includes(planSearch.toLowerCase())) return null;
        return <div key={guid} className={styles.stack}>
          {index % pace === 0 || planSearch ? <div className={styles.metaRow} id={index % pace === 0 ? `learning-day-${Math.floor(index / pace) + 1}` : undefined} style={{ scrollMarginTop: "80px" }}><h2>Day {Math.floor(index / pace) + 1}</h2><span className={styles.meta}>{draft.slice(Math.floor(index / pace) * pace,Math.floor(index / pace) * pace + pace).filter(item => listened.has(item)).length} of {draft.slice(Math.floor(index / pace) * pace,Math.floor(index / pace) * pace + pace).length} listened</span></div> : null}
          <article className={styles.episode} data-locked={locked}><div className={styles.episodeHeading}><DashboardIcon name={locked ? "lock" : "grip-vertical"} /><div className={styles.episodeCopy}><h3>{title}</h3><p className={styles.meta}>{episode?.duration || "Duration unavailable"} · {locked ? "Listened · Locked" : position ? `Saved at ${Math.floor(position.positionSeconds / 60)}:${String(Math.floor(position.positionSeconds % 60)).padStart(2,"0")}` : "Not started"}</p></div>{!locked ? <button type="button" className={styles.episodeMenu} aria-label={`Move or replace ${title}`} aria-expanded={editingSlot === guid} onClick={() => setEditingSlot(editingSlot === guid ? null : guid)}><DashboardIcon name="more" /></button> : null}</div>
            {!locked ? <>
              {editingSlot === guid ? <>
              <label className={styles.stack}>Move {title} to slot<select value={index} disabled={saving} onChange={event => { setDraft(moveRemainingEpisode(draft,listened,index,Number(event.target.value)));setError(null); }}>{draft.map((other,slot) => !listened.has(other) ? <option key={other} value={slot}>Day {Math.floor(slot / pace) + 1} · Episode {slot % pace + 1}</option> : null)}</select></label>
              <label className={styles.stack}>Replace {title}<select value={guid} disabled={saving} onChange={event => { setDraft(draft.map((item,slot) => slot === index ? event.target.value : item));setEditingSlot(null);setError(null); }}>{!episode ? <option value={guid}>Retain unavailable episode</option> : null}{data.episodes.filter(item => item.guid === guid || !queued.has(item.guid) && !archived.has(item.guid) && !listened.has(item.guid)).map(item => <option key={item.guid} value={item.guid}>{item.title}</option>)}</select></label>
              <div className={styles.tools}><button type="button" disabled={saving} onClick={() => remove(index)}>Remove episode</button></div>
              </> : null}
            </> : null}
          </article>
        </div>;
      })}
    </div>
    <button type="button" className={styles.secondary} onClick={() => setShowLibrary(true)}>Choose more episodes<DashboardIcon name="plus" /></button>
    </> : <section className={styles.stack} aria-label="Podcast library"><h2>All podcast episodes</h2><p className={styles.muted}>Purpose is optional. Your current plan stays active until you save.</p>
      <label className={styles.stack}>Search titles or series<input type="search" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <div className={styles.tools}>{["all","purpose","faith"].map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All episodes" : value === "purpose" ? "Purpose" : "Faith"}</button>)}</div>
      <button className={styles.secondary} type="button" disabled={saving || !data.episodes.length} onClick={() => { const recommendation = podcastSuggestion(data.episodes,pace).filter(guid => !queued.has(guid) && !archived.has(guid) && !listened.has(guid));setDraft([...draft,...recommendation]);setError(recommendation.length ? null : "No additional suggested episodes are currently available. You can choose from the library."); }}>Add Purpose-first suggestion<DashboardIcon name="plus" /></button>
      <p className={styles.meta} role="status">{draft.length} selected · Suggested starting length: {pace * 30} episodes. You can edit the full plan.</p>
      {!data.episodes.length ? <p className={styles.muted}>The episode library is unavailable. Your saved plan is unchanged. Refresh to try again.</p> : !library.length ? <p className={styles.muted}>No episodes match this search.</p> : null}
      {library.map(episode => <article key={episode.guid} className={styles.episode}><label className={styles.episodeLabel}><input type="checkbox" checked={queued.has(episode.guid)} disabled={saving || listened.has(episode.guid) || archived.has(episode.guid)} onChange={event => { if (event.target.checked) setDraft([...draft,episode.guid]);else remove(draft.indexOf(episode.guid)); }} /><span><strong>{episode.title}</strong><span className={styles.meta}>{episode.duration || "Duration unavailable"}{listened.has(episode.guid) ? " · Already listened" : ""}</span></span></label>{episode.audioUrl ? <details><summary>Preview episode</summary><audio controls preload="none" src={episode.audioUrl} className={styles.previewAudio} /></details> : <p className={styles.meta}>Preview unavailable</p>}</article>)}
    </section>}
    <div className={styles.footer}><p className={styles.meta}>Completed listens cannot be moved or replaced. Playback positions stay with their episodes.</p>{!data.canWrite ? <p className={styles.muted}>{learningWriteNotice(data)}</p> : null}{error ? <p role="alert" className={styles.error}>{error}</p> : null}{showLibrary ? <button type="button" className={styles.primary} onClick={() => { if (!draft.length && !existingPlan) { setError("Choose at least one episode to continue.");return; }setShowLibrary(false);setError(null); }}>Review selected episodes<DashboardIcon name="arrow" /></button> : existingPlan ? <button type="button" className={styles.primary} disabled={saving || !data.canWrite} onClick={() => save()}>{saving ? "Saving…" : "Save plan changes"}<DashboardIcon name="check" /></button> : <button type="button" className={styles.primary} disabled={!draft.length} onClick={() => { setError(null);setStage("ready"); }}>Review my tracklist<DashboardIcon name="arrow" /></button>}</div>
  </section>;
}
