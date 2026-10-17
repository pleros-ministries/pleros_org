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
        className={`whitespace-pre-line text-[14px] leading-[21px] text-[#3a4049] ${
          clamp ? "line-clamp-4" : ""
        }`}
      >
        {body}
      </p>
      {overflowing && !forceExpanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-fit text-[13px] font-medium text-[var(--color-community-muted)] hover:underline"
        >
          {expanded ? "Show less" : "See more"}
        </button>
      ) : null}
    </div>
  );
}
