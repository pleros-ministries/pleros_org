"use client";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";

import { SogpCalendar } from "./sogp-calendar";
import { SogpCourseOutline } from "./sogp-course-outline";
import { SogpLevelTracker } from "./sogp-level-tracker";

export function SogpCourseSidebar({
  data,
  selectedDateKey,
  onSelect,
}: {
  data: SogpJourneyData;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <section className="relative left-1/2 right-1/2 w-screen -mx-[50vw] rounded-none bg-[var(--color-brand-sky)] p-3 lg:static lg:left-auto lg:right-auto lg:mx-0 lg:w-auto lg:rounded-sm">
        <SogpCalendar
          days={data.days}
          selectedDateKey={selectedDateKey}
          todayKey={data.todayKey}
          onSelect={onSelect}
          tinted
        />
      </section>

      <div className="hidden lg:block">
        <SogpLevelTracker levels={data.levels} />
      </div>

      <SogpCourseOutline
        data={data}
        selectedDateKey={selectedDateKey}
        onSelect={onSelect}
        className="hidden lg:block"
        listClassName="max-h-[calc(100vh-19rem)]"
      />
    </div>
  );
}
