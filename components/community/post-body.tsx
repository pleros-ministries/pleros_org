"use client";

import { useEffect, useRef, useState } from "react";

export function PostBody({
  body,
  expanded: forceExpanded = false,
}: {
  body: string;
  expanded?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(forceExpanded);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    if (forceExpanded) return;
    const el = ref.current;
    if (el) setOverflowing(el.scrollHeight - el.clientHeight > 4);
  }, [body, forceExpanded]);

  const clamp = !forceExpanded && !expanded;

  return (
    <div className="grid gap-1">
      <p
        ref={ref}
        className={`whitespace-pre-line text-[15px] leading-relaxed text-zinc-800 ${
          clamp ? "line-clamp-[10]" : ""
        }`}
      >
        {body}
      </p>
      {overflowing && !forceExpanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-fit text-sm font-medium text-[var(--color-brand-blue)] hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
