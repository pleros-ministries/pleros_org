import {
  AdminMinistryPage,
  type AdminMinistryMember,
} from "@/components/community/admin-ministry-page";
import { requireAdmin } from "@/lib/auth/require-role";
import { groupActivitiesByDay } from "@/lib/community/ministry-activities";
import { isDateKey, resolveMinistryRange } from "@/lib/community/ministry-report";
import { listUnits } from "@/lib/db/queries/community-units";
import {
  getMemberMinistryHistory,
  getMinistryDay,
  getMinistryTotalsByDay,
  getMinistryTotalsByMember,
} from "@/lib/db/queries/ministry-activities";
import { listContactsForStaff } from "@/lib/db/queries/outreach-contacts";
import { lagosToday } from "@/lib/sogp/daily-date";
import { enumerateDateKeys } from "@/lib/sogp/daily-participation";

/** Most people the on-screen list loads for one range; the export has them all. */
const CONTACT_LIST_LIMIT = 2000;

export default async function AdminMinistryRoute({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    from?: string;
    to?: string;
    unit?: string;
    member?: string;
  }>;
}) {
  const session = await requireAdmin();

  const today = lagosToday();
  const query = await searchParams;
  const dateKey = isDateKey(query.date) && query.date <= today ? query.date : today;
  const range = resolveMinistryRange({ from: query.from, to: query.to }, today);
  const unit = Number(query.unit);
  const unitId = Number.isInteger(unit) && unit > 0 ? unit : null;
  const memberUserId = query.member || null;

  const [rows, totalsByDay, totalsByMember, contacts, units, history] =
    await Promise.all([
      getMinistryDay({ dateKey, unitId }),
      getMinistryTotalsByDay(range.from, range.to, { unitId }),
      getMinistryTotalsByMember(range.from, range.to, { unitId }),
      listContactsForStaff({
        fromKey: range.from,
        toKey: range.to,
        unitId,
        memberUserId,
        limit: CONTACT_LIST_LIMIT,
      }),
      listUnits(),
      memberUserId
        ? getMemberMinistryHistory(memberUserId, range.from, range.to)
        : Promise.resolve(null),
    ]);

  let member: AdminMinistryMember | null = null;
  if (history && memberUserId) {
    const byDay = groupActivitiesByDay(history.activities);
    member = {
      userId: memberUserId,
      name: history.name,
      unitName: history.unitName,
      days: enumerateDateKeys(range.from, range.to)
        .reverse()
        .map((day) => ({
          dateKey: day,
          activities: byDay.get(day) ?? [],
          activity: history.activity.get(day) ?? null,
        })),
    };
  }

  return (
    <AdminMinistryPage
      key={`${dateKey}-${range.from}-${range.to}-${unitId ?? "all"}-${member?.userId ?? "none"}`}
      today={today}
      dateKey={dateKey}
      range={range}
      unitId={unitId}
      units={units.map((item) => ({ id: item.id, name: item.name }))}
      rows={rows}
      totalsByDay={totalsByDay}
      totalsByMember={totalsByMember}
      contacts={contacts}
      contactLimitReached={contacts.length >= CONTACT_LIST_LIMIT}
      member={member}
      viewer={{ userId: session.user.id, isAdmin: true }}
    />
  );
}
