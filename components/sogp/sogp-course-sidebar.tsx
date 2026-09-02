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
      <section className="rounded-sm border border-zinc-200 bg-white p-3">
        <SogpCalendar
          days={data.days}
          selectedDateKey={selectedDateKey}
          todayKey={data.todayKey}
          onSelect={onSelect}
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
