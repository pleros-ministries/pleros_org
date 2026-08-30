"use client";

import { useState } from "react";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { SogpCourseOutline } from "./sogp-course-outline";
import { SogpLevelTracker } from "./sogp-level-tracker";
import { SogpMobileCourseTrigger } from "./sogp-mobile-course-trigger";

export function SogpMobileCourseSidebar({
  data,
  selectedDateKey,
  onSelect,
}: {
  data: SogpJourneyData;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
}) {
  const [open, setOpen] = useState(false);

  function selectDay(dateKey: string) {
    onSelect(dateKey);
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<SogpMobileCourseTrigger />} />
        <SheetContent
          side="left"
          className="site-font-theme w-[min(92%,22rem)] gap-0 overflow-y-auto p-0 lg:hidden"
        >
          <SheetHeader className="border-b border-[var(--color-line)] px-5 py-5">
            <SheetTitle className="font-[var(--font-sen)] text-xl font-semibold tracking-[-0.04em]">
              Course menu
            </SheetTitle>
            <SheetDescription className="text-sm">
              Review your level progress and move between SOGP teachings.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 p-4">
            <SogpLevelTracker levels={data.levels} defaultExpanded />
            <SogpCourseOutline
              data={data}
              selectedDateKey={selectedDateKey}
              onSelect={selectDay}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
