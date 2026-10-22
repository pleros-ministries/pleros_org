"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties } from "react";
import { BellIcon, CheckIcon } from "lucide-react";

import type { NextLearningPick } from "@/app/(site)/dashboard/sogp/next/_actions";
import groupStyles from "@/components/community/discipleship/discipleship-group.module.css";
import { ReportSheet, sheetStyles as sheet } from "@/components/community/report/report-sheet";

/**
 * What's next after SOGP (Pastor, 21 October; built from the approved mockup).
 * People who finish choose their next teachings so they always have something
 * to learn, share and post, and the choice becomes their current learning.
 * Only what exists is offered. A series or your own journey opens its own
 * page to pick episodes; the rest confirm in a sheet. `preview` never saves.
 */

export type NextOption = {
  key: string;
  art: "podcast" | "sogp" | "library" | "pre-sogp" | "advanced";
  title: string;
  detail: string;
  meta: string;
  /** Saved straight from the sheet; options without one open `href` to pick episodes. */
  pick?: NextLearningPick;
  href?: string;
  current?: boolean;
};

const thumb = (art: NextOption["art"]): CSSProperties => ({ backgroundImage: `image-set(url("/assets/dashboard/learning-cards/${art}-tile-192.webp") 1x, url("/assets/dashboard/learning-cards/${art}-tile-384.webp") 2x)` });

export function NextLearningChooser({ options, advancedInterest, preview = false }: { options: NextOption[]; advancedInterest: boolean; preview?: boolean }) {
  const router = useRouter();
  const [choice, setChoice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [notify, setNotify] = useState(advancedInterest);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const picked = options.find(option => option.key === choice) ?? null;

  const next = () => {
    if (!picked) return;
    if (picked.href) { router.push(picked.href); return; }
    setError(null); setConfirm(true);
  };

  const start = () => {
    if (!picked?.pick) return;
    if (preview) { setConfirm(false); return; }
    startTransition(async () => {
      const { chooseNextLearningAction } = await import("@/app/(site)/dashboard/sogp/next/_actions");
      const result = await chooseNextLearningAction(picked.pick!).catch(() => ({ ok: false as const, error: "Couldn’t save that. Check your connection and try again." }));
      if (result.ok) router.push("/dashboard/sogp");
      else setError(result.error);
    });
  };

  // Shows at once; rolls back with a message if it doesn't save.
  const notifyMe = () => {
    if (notify) return;
    setNotify(true); setNotifyError(null);
    if (preview) return;
    void import("@/app/(site)/dashboard/_actions/advanced-sogp").then(({ registerAdvancedSogpInterestAction }) => registerAdvancedSogpInterestAction())
      .catch(() => ({ ok: false as const, error: "Couldn’t save that. Check your connection and try again." }))
      .then(result => { if (!result.ok) { setNotify(false); setNotifyError(result.error); } });
  };

  return <div className="grid gap-3.5">
    <div><h1>What’s next?</h1><p className={groupStyles.sub}>You’ve finished SOGP. Choose what you’ll learn next</p></div>
    <div className={groupStyles.panel}><ul className={groupStyles.list} role="radiogroup" aria-label="Your next learning">
      {options.map(option => {
        const on = choice === option.key;
        return <li key={option.key}>
          <button type="button" role="radio" aria-checked={on} onClick={() => setChoice(option.key)}
            className={`${groupStyles.row} w-full items-start text-left`} style={on ? { background: "#f6f8fe" } : undefined}>
            <span className="size-12 shrink-0 rounded-[12px] bg-cover bg-center" style={thumb(option.art)} aria-hidden="true" />
            <span className={`${groupStyles.rowCopy} gap-0.5`}>
              <span className={groupStyles.rowTitle} style={{ whiteSpace: "normal" }}>{option.title}{option.current ? <span className="ml-1.5 inline-block h-5 rounded-full bg-[#eceef2] px-2 align-[1px] text-[11px] font-medium leading-5 text-(--color-text-muted)">Current</span> : null}</span>
              <span className={groupStyles.rowMeta} style={{ whiteSpace: "normal" }}>{option.detail}</span>
              <span className={groupStyles.rowMeta} style={{ color: "var(--color-community-blue)" }}>{option.meta}</span>
            </span>
            <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]" style={{ borderColor: on ? "var(--color-community-blue)" : "#c9ced6", background: on ? "var(--color-community-blue)" : "transparent" }} aria-hidden="true">
              {on ? <CheckIcon className="size-3 text-white" strokeWidth={3} /> : null}
            </span>
          </button>
        </li>;
      })}
      {/* Advanced SOGP can't be chosen yet: a plain row with its own Notify me, never a button inside a button. */}
      <li><div className={`${groupStyles.row} items-start`}>
        <span className="size-12 shrink-0 rounded-[12px] bg-cover bg-center" style={thumb("advanced")} aria-hidden="true" />
        <span className={`${groupStyles.rowCopy} gap-0.5`}>
          <span className={groupStyles.rowTitle} style={{ whiteSpace: "normal" }}>Advanced SOGP</span>
          <span className={groupStyles.rowMeta} style={{ whiteSpace: "normal" }}>Deeper formation for those who’ve finished SOGP</span>
          <span className={groupStyles.rowMeta} style={{ color: "#a15c12" }}>Coming soon</span>
          {notifyError ? <span role="alert" className={groupStyles.rowMeta} style={{ color: "#a15c12", whiteSpace: "normal" }}>{notifyError}</span> : null}
        </span>
        <button type="button" className={`${groupStyles.btn} mt-1 shrink-0`} aria-pressed={notify} disabled={notify} onClick={notifyMe}>
          {notify ? <><CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />Notifying</> : <><BellIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />Notify me</>}
        </button>
      </div></li>
    </ul></div>
    <button type="button" className={`${groupStyles.btn} h-[38px] justify-self-stretch text-[13.5px]`} data-primary disabled={!picked} onClick={next}>
      {picked?.href ? (picked.key === "series" ? "Choose the series" : "Pick your episodes") : "Make it my current learning"}
    </button>
    <p className={groupStyles.note}>Your SOGP history and certificate stay as they are. You can change your next learning any time from Learning.</p>

    {confirm && picked ? <ReportSheet title={`Start ${picked.title}?`} subtitle="It becomes your current learning, at the top of Learning" onClose={() => setConfirm(false)}
      footer={close => <>
        <button type="button" className={sheet.quiet} onClick={close}>Not yet</button>
        <button type="button" className={`${sheet.primary} ${sheet.fit}`} disabled={pending} onClick={start}>{pending ? "Starting…" : "Start"}</button>
      </>}>
      {() => <>
        <p className={sheet.muted}>{picked.pick?.kind === "lesson" ? "Listen, read the notes and take the quiz at your own pace." : "Day 1 starts today, one episode a day. Missed days wait for you, as in SOGP."}</p>
        {error ? <p role="alert" className={sheet.error}>{error}</p> : null}
      </>}
    </ReportSheet> : null}
  </div>;
}
