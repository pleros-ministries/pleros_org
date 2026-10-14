"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { chooseSogpPathAction, editSogpPlanAction } from "@/app/_actions/sogp-learning-actions";
import { moveRemainingEpisode, podcastSuggestion, learningWriteNotice, type LearningViewData } from "@/lib/sogp/learning-view";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import styles from "./learning.module.css";

export function PlanEditor({ data,requestedPath }: { data: LearningViewData;requestedPath?: "podcast_one" | "podcast_two" }) {
  const router = useRouter();
  const query = useQueryClient();
  const [base] = useState(() => ({ revision: data.state?.revision ?? 0,guids: [...(data.state?.plan?.episodeGuids ?? [])] }));
  const pace = data.state?.plan?.episodesPerDay ?? (requestedPath === "podcast_two" ? 2 : 1);
  const [draft,setDraft] = useState<string[]>(base.guids);
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState("all");
  const [editingSlot,setEditingSlot] = useState<string | null>(null);
  const [error,setError] = useState<string | null>(null);
  const [saving,startSave] = useTransition();
  const dirty = JSON.stringify(base.guids) !== JSON.stringify(draft);
  const listened = new Set(data.state?.progress.listenedEpisodeGuids ?? []);
  const archived = new Set(data.state?.plan?.historyEpisodeGuids ?? []);
  const episodes = new Map(data.episodes.map(episode => [episode.guid,episode]));
  const queued = new Set(draft);
  const positions = new Map(data.state?.progress.playbackPositions.map(position => [position.episodeGuid,position]) ?? []);
  const dayNumbers = Array.from({ length: Math.ceil(draft.length / pace) },(_,index) => index + 1);
  const existingPlan = data.state?.plan !== null && data.state?.plan !== undefined;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault();event.returnValue = ""; };
    window.addEventListener("beforeunload",warn);
    return () => window.removeEventListener("beforeunload",warn);
  },[dirty]);
  function remove(index: number) {
    if (draft.slice(index).some(guid => listened.has(guid))) { setError("Removing this slot would move a completed episode. Replace its episode instead.");return; }
    setDraft(draft.filter((_,position) => position !== index));setError(null);
  }
  function save() {
    if (!existingPlan && !draft.length) { setError("Choose at least one episode to start your plan.");return; }
    startSave(async () => {
      try {
        const result = existingPlan ? await editSogpPlanAction({ expectedRevision: base.revision,episodeGuids: draft }) : await chooseSogpPathAction({ expectedRevision: base.revision,path: requestedPath ?? "podcast_one",episodeGuids: draft });
        if (!result.ok) { setError(result.error);return; }
        query.setQueryData<LearningViewData>(["sogp","learning-v3"],old => ({ ...(old ?? data),state: result.value }));
        router.push("/dashboard/sogp");router.refresh();
      } catch { setError("Your plan could not be saved. Your draft is still here; try again."); }
    });
  }
  const library = data.episodes.filter(episode => (!search || episode.title.toLowerCase().includes(search.toLowerCase())) && (filter === "all" || episode.title.toLowerCase().includes(filter)));
  return <section className={styles.page}>
    <Link href="/dashboard/sogp" onClick={event => { if (dirty && !window.confirm("Leave without saving your plan changes?")) event.preventDefault(); }}>← Back to My SOGP</Link>
    <header className={styles.header}><p className={styles.meta}>Podcast · {pace === 2 ? "30" : "15"} min/day</p><h1>Make the plan yours</h1><p className={styles.muted}>Reorder or replace remaining episodes. Completed episodes stay in your history.</p></header>
    <div className={styles.notice}><h2>{Math.ceil(draft.length / pace)} learning days · {draft.length} episodes</h2><p className={styles.meta}>{draft.filter(guid => listened.has(guid)).length} listened in this queue · {archived.size} in retained history</p><Link href="/dashboard/sogp/path">Switch path</Link></div>
    <label className={styles.stack}>Jump to day<select defaultValue="" onChange={event => document.getElementById(`learning-day-${event.target.value}`)?.scrollIntoView({ behavior: "instant",block: "start" })}><option value="" disabled>Choose a day</option>{dayNumbers.map(day => <option key={`day-${day}`} value={day}>Day {day}</option>)}</select></label>
    <div className={styles.stack}>
      {!draft.length ? <p className={styles.muted}>No episodes selected. Browse the library below or add the optional suggestion.</p> : null}
      {draft.map((guid,index) => {
        const episode = episodes.get(guid), title = episode?.title ?? "Episode no longer in the catalogue", locked = listened.has(guid), position = positions.get(guid);
        return <div key={guid} className={styles.stack}>
          {index % pace === 0 ? <h2 id={`learning-day-${Math.floor(index / pace) + 1}`} style={{ scrollMarginTop: "80px" }}>Day {Math.floor(index / pace) + 1}</h2> : null}
          <article className={styles.episode} data-locked={locked}><h3>{title}</h3><p className={styles.meta}>{episode?.duration || "Duration unavailable"} · {locked ? "Listened · Locked" : position ? `Saved at ${Math.floor(position.positionSeconds / 60)}:${String(Math.floor(position.positionSeconds % 60)).padStart(2,"0")}` : "Not started"}</p>
            {locked ? <StatusPill tone="green">Listened</StatusPill> : <>
              <div className={styles.tools}><button type="button" aria-expanded={editingSlot === guid} onClick={() => setEditingSlot(editingSlot === guid ? null : guid)}>Move or replace {title}</button></div>
              {editingSlot === guid ? <>
              <label className={styles.stack}>Move {title} to slot<select value={index} disabled={saving} onChange={event => { setDraft(moveRemainingEpisode(draft,listened,index,Number(event.target.value)));setError(null); }}>{draft.map((other,slot) => !listened.has(other) ? <option key={other} value={slot}>Day {Math.floor(slot / pace) + 1} · Episode {slot % pace + 1}</option> : null)}</select></label>
              <label className={styles.stack}>Replace {title}<select value={guid} disabled={saving} onChange={event => { setDraft(draft.map((item,slot) => slot === index ? event.target.value : item));setEditingSlot(null);setError(null); }}>{!episode ? <option value={guid}>Retain unavailable episode</option> : null}{data.episodes.filter(item => item.guid === guid || !queued.has(item.guid) && !archived.has(item.guid) && !listened.has(item.guid)).map(item => <option key={item.guid} value={item.guid}>{item.title}</option>)}</select></label>
              <div className={styles.tools}><button type="button" disabled={saving} onClick={() => remove(index)}>Remove episode</button></div>
              </> : null}
            </>}
          </article>
        </div>;
      })}
    </div>
    <section className={styles.stack} aria-label="Podcast library"><h2>Choose your episodes</h2><p className={styles.muted}>Browse the library or use a suggested start. Purpose is optional. Your current plan stays active until you save.</p>
      <label className={styles.stack}>Search titles or series<input type="search" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <div className={styles.tools}>{["all","purpose","faith"].map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All episodes" : value === "purpose" ? "Purpose" : "Faith"}</button>)}</div>
      <button className={styles.secondary} type="button" disabled={saving || !data.episodes.length} onClick={() => { const recommendation = podcastSuggestion(data.episodes,pace).filter(guid => !queued.has(guid) && !archived.has(guid) && !listened.has(guid));setDraft([...draft,...recommendation]);setError(recommendation.length ? null : "No additional suggested episodes are currently available. You can choose from the library."); }}>Add Purpose-first suggestion<DashboardIcon name="plus" /></button>
      <p className={styles.meta} role="status">{draft.length} selected · Suggested starting length: {pace * 30} episodes. You can edit the full plan.</p>
      {!data.episodes.length ? <p className={styles.muted}>The episode library is unavailable. Your saved plan is unchanged. Refresh to try again.</p> : !library.length ? <p className={styles.muted}>No episodes match this search.</p> : null}
      {library.map(episode => <article key={episode.guid} className={styles.episode}><label className={styles.episodeLabel}><input type="checkbox" checked={queued.has(episode.guid)} disabled={saving || listened.has(episode.guid) || archived.has(episode.guid)} onChange={event => { if (event.target.checked) setDraft([...draft,episode.guid]);else remove(draft.indexOf(episode.guid)); }} /><span><strong>{episode.title}</strong><span className={styles.meta}>{episode.duration || "Duration unavailable"}{listened.has(episode.guid) ? " · Already listened" : ""}</span></span></label>{episode.audioUrl ? <details><summary>Preview episode</summary><audio controls preload="none" src={episode.audioUrl} className={styles.previewAudio} /></details> : <p className={styles.meta}>Preview unavailable</p>}</article>)}
    </section>
    <div className={styles.footer}><p className={styles.meta}>Completed listens cannot be moved or replaced. Playback positions stay with their episodes.</p>{!data.canWrite ? <p className={styles.muted}>{learningWriteNotice(data)}</p> : null}{error ? <p role="alert" className={styles.error}>{error}</p> : null}<button type="button" className={styles.primary} disabled={saving || !data.canWrite} onClick={save}>{saving ? "Saving…" : existingPlan ? "Save plan changes" : "Start my podcast plan"}<DashboardIcon name="check" /></button></div>
  </section>;
}
