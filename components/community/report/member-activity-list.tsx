import {
  activityKeyNumbers,
  activityTitle,
  activityWhere,
} from "@/lib/community/activity-form";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";

/** One member's activities for a day, read-only, for the pastor's and admin's tables. */
export function MemberActivityList({
  activities,
  showNotes = true,
}: {
  activities: MemberActivity[];
  /** Notes are for admins and the assigned pastor only. */
  showNotes?: boolean;
}) {
  if (activities.length === 0) {
    return <p className="text-xs text-zinc-500">Nothing logged.</p>;
  }
  return (
    <ul className="grid gap-2 text-xs">
      {activities.map((activity) => {
        const where = activityWhere(activity);
        return (
          <li key={activity.id} className="grid gap-0.5">
            <p className="text-zinc-900">
              <span className="font-medium">{activityTitle(activity)}</span>
              {where ? <span className="text-zinc-500"> · {where}</span> : null}
            </p>
            <p className="text-zinc-700">
              {activityKeyNumbers(activity)}
              {activity.peopleCount > 0
                ? ` · ${activity.peopleCount} ${activity.peopleCount === 1 ? "person" : "people"}`
                : ""}
            </p>
            {showNotes && activity.note ? (
              <p className="text-zinc-600">{activity.note}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
