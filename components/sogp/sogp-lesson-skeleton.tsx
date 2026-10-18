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

function Rows({ count }: { count: number }) {
  return (
    <div className={lesson.panel}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={lesson.row}>
          <Bar style={{ width: 36, height: 36, borderRadius: 10, flex: "none" }} />
          <span className={lesson.rowCopy} style={{ gap: 6 }}>
            <Bar style={{ height: 13, width: "58%" }} />
            <Bar style={{ height: 11, width: "36%" }} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Lesson page: title, audio card, tabs, notes, rows, continue. */
export function SogpLessonSkeleton() {
  return (
    <section className={lesson.page} aria-busy="true" aria-label="Loading lesson">
      <Header />
      <div className={lesson.card}>
        <Bar style={{ height: 12, width: 150 }} />
        <Bar style={{ height: 196, borderRadius: 10 }} />
      </div>
      <Bar style={{ height: 38, borderRadius: 10 }} />
      <div className={`${lesson.panel} ${lesson.notes}`}>
        <Bar style={{ height: 12, width: "92%" }} />
        <Bar style={{ height: 12, width: "84%" }} />
        <Bar style={{ height: 12, width: "66%" }} />
      </div>
      <Rows count={3} />
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
