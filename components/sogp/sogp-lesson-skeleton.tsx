import type { CSSProperties } from "react";

import lesson from "./sogp-lesson.module.css";

function Bar({ style }: { style: CSSProperties }) {
  return <span className={lesson.skel} style={style} />;
}

function Header() {
  return (
    <div className={lesson.header} style={{ gap: 6 }}>
      <Bar style={{ height: 24, width: "72%" }} />
      <Bar style={{ height: 13, width: "44%" }} />
    </div>
  );
}

/** Lesson page: title, step strip, player, three tabs, notes, continue. */
export function SogpLessonSkeleton() {
  return (
    <section className={lesson.page} aria-busy="true" aria-label="Loading lesson">
      <Header />
      <Bar style={{ height: 4, borderRadius: 2 }} />
      <Bar style={{ height: 150, borderRadius: 12 }} />
      <Bar style={{ height: 42, borderRadius: 0 }} />
      <Bar style={{ height: 12, width: "92%" }} />
      <Bar style={{ height: 12, width: "84%" }} />
      <Bar style={{ height: 12, width: "66%" }} />
      <Bar style={{ height: 40, borderRadius: 12 }} />
    </section>
  );
}

/** Quiz: title, two question cards with options, submit. */
export function SogpQuizSkeleton() {
  return (
    <section className={lesson.page} aria-busy="true" aria-label="Loading quiz">
      <Header />
      {[0, 1].map((question) => (
        <div key={question} className={lesson.question}>
          <Bar style={{ height: 15, width: "80%" }} />
          <div className={lesson.options}>
            {[0, 1, 2].map((option) => <Bar key={option} style={{ height: 44, borderRadius: 10 }} />)}
          </div>
        </div>
      ))}
      <Bar style={{ height: 40, borderRadius: 12 }} />
    </section>
  );
}

/** Written response: title, prompt, text area, actions. */
export function SogpResponseSkeleton() {
  return (
    <section className={lesson.page} aria-busy="true" aria-label="Loading written response">
      <Header />
      <Bar style={{ height: 96, borderRadius: 12 }} />
      <Bar style={{ height: 260, borderRadius: 12 }} />
      <div className={lesson.actions}>
        <Bar style={{ height: 40, borderRadius: 11 }} />
        <Bar style={{ height: 40, borderRadius: 12 }} />
      </div>
    </section>
  );
}
