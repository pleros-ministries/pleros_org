"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowRight, ChevronDown, MessageCircleMore } from "lucide-react";

import lesson from "./sogp-lesson.module.css";

/** Ask about a lesson or podcast episode: to the active discipler (one private
    thread for both), else Ask Pleros with the item attached (user, 18 October). */
export function DisciplerQuestion({ guid, title, kind, disabled = false }: { guid: string; title: string; kind: "lesson" | "episode"; disabled?: boolean }) {
  const [route, setRoute] = useState<"discipler" | "ask" | null>(null);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSend] = useTransition();
  useEffect(() => {
    let live = true;
    import("@/app/(site)/dashboard/sogp/discipleship/_actions")
      .then(({ getEpisodeQuestionRouteAction }) => getEpisodeQuestionRouteAction())
      .then(result => { if (live) setRoute(result.kind === "discipler" ? "discipler" : "ask"); }, () => { if (live) setRoute("ask"); });
    return () => { live = false; };
  }, []);
  function send() {
    if (!body.trim()) { setError("Write your question first."); return; }
    startSend(async () => {
      try {
        const { askEpisodeQuestionAction } = await import("@/app/(site)/dashboard/sogp/discipleship/_actions");
        const result = await askEpisodeQuestionAction({ episodeGuid: guid, episodeTitle: title, body: body.trim() });
        if (!result.ok) { setError(result.error); return; }
        setBody(""); setOpen(false); setSent(true); setError(null);
      } catch { setError("Your question could not be sent. Try again."); }
    });
  }
  const chip = <span className={lesson.quietIcon}><MessageCircleMore className="size-4" aria-hidden/></span>;
  if (route === "ask") {
    const params = new URLSearchParams({ episodeGuid: guid, episodeTitle: title });
    return <Link className={lesson.quietRow} href={`/dashboard/community/ask?${params.toString()}`}>{chip}<span className={lesson.rowCopy}><span className={lesson.rowTitle}>Ask a question</span><span className={lesson.rowMeta}>Goes to Pleros through Ask Pleros</span></span><ArrowRight className={`size-4 ${lesson.rowEnd}`} aria-hidden/></Link>;
  }
  return <div>
    <button type="button" className={lesson.quietRow} disabled={!route || disabled} aria-expanded={open} onClick={() => { setOpen(value => !value); setSent(false); }}>{chip}<span className={lesson.rowCopy}><span className={lesson.rowTitle}>Ask your discipler</span><span className={lesson.rowMeta}>{sent ? "Sent. Their reply shows in your group." : "Only you and your discipler see it"}</span></span><ChevronDown className={`size-4 ${lesson.rowEnd}`} style={{ transform: open ? "rotate(180deg)" : undefined }} aria-hidden/></button>
    {open ? <div className={lesson.askBody}>
      <label className={lesson.askLabel}>Your question<textarea className={lesson.textarea} rows={4} maxLength={2000} value={body} disabled={saving} onChange={event => setBody(event.target.value)} placeholder={`What would you like to ask about this ${kind}?`} /></label>
      {error ? <p role="alert" className={lesson.error}>{error}</p> : null}
      <button type="button" className={lesson.primary} disabled={saving || disabled} onClick={send}>{saving ? "Sending…" : "Send to my discipler"}</button>
    </div> : null}
  </div>;
}
