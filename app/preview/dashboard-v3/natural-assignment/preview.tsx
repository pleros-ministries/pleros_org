"use client";

import { useState } from "react";

import { NaturalAssignmentMockup, OtherReportsEntry } from "@/components/community/report/natural-assignment-mockup";

/** First the entry as it sits at the foot of My reports, then the report it opens. */
export function NaturalAssignmentPreview() {
  const [open, setOpen] = useState(false);
  if (open) return <NaturalAssignmentMockup />;
  return <div className="mx-auto grid w-full max-w-[640px] gap-3 px-4 pt-[18px] pb-7">
    <p className="m-0 text-[12.5px] text-[var(--color-community-muted)]">At the foot of My reports, below Devotion, Ministry and Meetings:</p>
    <OtherReportsEntry onOpen={() => setOpen(true)} />
  </div>;
}
