"use client";

import { useState } from "react";
import { CheckIcon, PlayIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";

import { useAskAfterTeaching, type QuestionRoute } from "./ask-after-teaching";

/** The real question prompt in preview mode: finishing the stand-in teaching opens it, and nothing is sent. */
export function AskAfterTeachingPreview({ route }: { route: QuestionRoute }) {
  const ask = useAskAfterTeaching(route);
  const [listened, setListened] = useState(false);
  return <div className={styles.page}>
    <div><h1>Biblical Origin and Ontology</h1><p className={styles.sub}>Level 2 · Track 10</p></div>
    <div className={`${styles.panel} grid gap-3 p-4`}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-community-blue)] text-white" aria-hidden="true">{listened ? <CheckIcon className="size-5" strokeWidth={2.4} /> : <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} />}</span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Teaching audio</span><span className={styles.rowMeta}>{listened ? "Listened" : "62% listened"}</span></span>
      </div>
      <button type="button" className={`${styles.btn} justify-self-start`} onClick={() => { setListened(true); ask.prompt({ guid: "preview", title: "Biblical Origin and Ontology" }); }}>Preview: finish the teaching</button>
    </div>
    {ask.ui}
  </div>;
}
