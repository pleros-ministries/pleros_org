"use client";

import { useRef, useState, type ReactNode } from "react";

import { ReportSheet, sheetStyles as sheet } from "@/components/community/report/report-sheet";

/**
 * "Do you have a question?" after every teaching (Pastor, 21 October). Pages
 * call `prompt` when a teaching is finished: the lesson's audio reaches 90%, a
 * podcast episode ends, or Teaching is ticked on Home. With a leader the
 * question goes to them privately; without one it goes to Ask Pleros, where
 * the asker chooses anonymous or named every time. Asking or "Not now" closes
 * it for that teaching on this device. Sending shows at once and reopens the
 * sheet with the words kept if it fails.
 */

export type FinishedTeaching = { guid: string; title: string };
/** `leaders` lists every group's leader for someone in several groups (multi-group membership, 29 October). */
export type QuestionRoute = { kind: "discipler"; leaderFirstName: string; leaders?: Array<{ groupId: number; firstName: string }> } | { kind: "ask-pleros" };
type Route = QuestionRoute;

const seenKey = (guid: string) => `pleros-teaching-question:${guid}`;
function seen(guid: string) {
  try { return window.localStorage.getItem(seenKey(guid)) !== null; } catch { return false; }
}
function markSeen(guid: string) {
  try { window.localStorage.setItem(seenKey(guid), "1"); } catch { /* Private windows: it may ask again, which is harmless. */ }
}

/** `then` runs once the prompt is answered or closed (or at once when it won't show), so pages can chain what comes next. */
export function useAskAfterTeaching(preview?: Route): { prompt: (teaching: FinishedTeaching, then?: () => void) => void; ui: ReactNode } {
  const [teaching, setTeaching] = useState<FinishedTeaching | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [body, setBody] = useState("");
  const [as, setAs] = useState<"anonymous" | "named" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // The leader they chose; their first group's until they pick.
  const [groupId, setGroupId] = useState<number | null>(null);
  const after = useRef<(() => void) | null>(null);
  const finish = () => { const next = after.current; after.current = null; next?.(); };

  const prompt = (next: FinishedTeaching, then?: () => void) => {
    if ((!preview && seen(next.guid)) || teaching) { then?.(); return; }
    after.current = then ?? null;
    setTeaching(next); setBody(""); setAs(null); setError(null); setGroupId(null);
    // Previews never ask the server where a question goes, or send one.
    if (preview) { setRoute(preview); return; }
    import("@/app/(site)/dashboard/sogp/discipleship/_actions")
      .then(({ getEpisodeQuestionRouteAction }) => getEpisodeQuestionRouteAction())
      .then(setRoute, () => setRoute({ kind: "ask-pleros" }));
  };

  const dismiss = () => { if (teaching && !preview) markSeen(teaching.guid); setTeaching(null); finish(); };

  const leaders = route?.kind === "discipler" ? route.leaders ?? [] : [];
  const chosen = leaders.find(item => item.groupId === groupId) ?? leaders[0] ?? null;
  const leaderName = chosen?.firstName ?? (route?.kind === "discipler" ? route.leaderFirstName : "");

  const send = (close: () => void) => {
    if (!teaching || !route) return;
    const asked = teaching, words = body.trim(), choice = as, toGroup = chosen?.groupId;
    const sentTo = route.kind === "discipler" ? `Sent to ${leaderName}. Their reply shows in your group.` : "Sent to Pleros. The reply shows in Ask Pleros.";
    if (!preview) markSeen(asked.guid);
    close();
    finish();
    setNotice(sentTo);
    window.setTimeout(() => setNotice(current => current === sentTo ? null : current), 4000);
    if (preview) return;
    (async () => {
      try {
        const result = route.kind === "discipler"
          ? await (await import("@/app/(site)/dashboard/sogp/discipleship/_actions")).askEpisodeQuestionAction({ episodeGuid: asked.guid, episodeTitle: asked.title, body: words, groupId: toGroup })
          : await (await import("@/app/(site)/dashboard/community/_actions/ask-actions")).askPleros({ body: words, visibility: choice ?? "", episodeGuid: asked.guid, episodeTitle: asked.title });
        if (!result.ok) throw new Error(result.error);
      } catch (cause) {
        // Put the question back so nothing typed is lost.
        setNotice(null);
        setTeaching(asked); setBody(words); setAs(choice);
        setError(cause instanceof Error && cause.message ? cause.message : "Your question couldn’t be sent. Try again.");
      }
    })();
  };

  const ready = body.trim().length >= 3 && route !== null && (route.kind === "discipler" || as !== null);
  const ui = <>
    {teaching ? <ReportSheet title="Do you have a question?" subtitle={`About ${teaching.title}`} onClose={dismiss}
      footer={close => <>
        <button type="button" className={sheet.quiet} onClick={close}>Not now</button>
        <button type="button" className={`${sheet.primary} ${sheet.fit}`} disabled={!ready} onClick={() => send(close)}>
          {route?.kind === "discipler" ? `Send to ${leaderName}` : "Send to Pleros"}
        </button>
      </>}>
      {() => <>
        {/* In several groups: they choose whose leader gets it. */}
        {leaders.length > 1 ? <div className={sheet.field}><span className={sheet.label}>Ask</span>
          <div className={sheet.chips} role="group" aria-label="Which leader">
            {leaders.map(item => <button key={item.groupId} type="button" className={sheet.chip} aria-pressed={chosen?.groupId === item.groupId} onClick={() => setGroupId(item.groupId)}>{item.firstName}</button>)}
          </div>
        </div> : null}
        <label className={sheet.field}><span className={sheet.label}>Your question</span>
          <textarea className={sheet.textarea} rows={4} maxLength={2000} value={body} onChange={event => setBody(event.target.value)} placeholder="What would you like to ask about this teaching?" />
        </label>
        {error ? <p role="alert" className={sheet.error}>{error}</p> : null}
        {route === null ? null : route.kind === "discipler" ? <p className={sheet.hint}>Only you and {leaderName} see it.</p> : <>
          <div className={sheet.field}><span className={sheet.label}>How to ask</span>
            {/* Ask Pleros needs the choice made each time, so nothing is preselected. */}
            <div className={sheet.chips} role="group" aria-label="How to ask">
              <button type="button" className={sheet.chip} aria-pressed={as === "anonymous"} onClick={() => setAs("anonymous")}>Ask anonymously</button>
              <button type="button" className={sheet.chip} aria-pressed={as === "named"} onClick={() => setAs("named")}>Show my name</button>
            </div>
          </div>
          <p className={sheet.hint}>{as === "anonymous" ? "The Pleros team won’t see who asked." : as === "named" ? "The Pleros team will see your name." : "Choose one to send."}</p>
        </>}
      </>}
    </ReportSheet> : null}
    {notice ? <p role="status" className="fixed inset-x-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-50 mx-auto max-w-[480px] rounded-[10px] bg-[#1f2937] px-4 py-3 text-[13px] leading-5 text-white shadow-lg lg:bottom-6">{notice}</p> : null}
  </>;
  return { prompt, ui };
}
