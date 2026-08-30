"use client";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";

import { SogpCalendar } from "./sogp-calendar";
import { SogpCourseOutline } from "./sogp-course-outline";
import { SogpLevelTracker } from "./sogp-level-tracker";
import { SogpMobileCourseSidebar } from "./sogp-mobile-course-sidebar";

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
    <div className="grid gap-3">
      <section className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-3.5">
        <SogpCalendar
          days={data.days}
          selectedDateKey={selectedDateKey}
          todayKey={data.todayKey}
          onSelect={onSelect}
        />
      </section>

      <SogpMobileCourseSidebar
        data={data}
        selectedDateKey={selectedDateKey}
        onSelect={onSelect}
      />

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
