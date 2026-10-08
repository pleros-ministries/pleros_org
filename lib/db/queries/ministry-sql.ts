import { sql } from "drizzle-orm";

import * as schema from "@/lib/db/schema";
import type { InteractionKind } from "@/lib/community/outreach-contacts";

/**
 * Correlated sub-selects used in the ministry lists. Each one aliases its
 * inner table and names the outer table in full. A column interpolated on
 * its own (`${table.column}`) is printed without its table name whenever the
 * outer query has no join, and inside a sub-select that bare name resolves to
 * the inner table, silently comparing a row with itself.
 */

const activities = schema.ministryActivities;
const contacts = schema.outreachContacts;
const interactions = schema.outreachContactInteractions;

/** People linked to an activity: met at an outreach, or followed up in a follow-up. */
export const activityPeopleCount = sql<number>`(
  select count(*) from ${interactions} as i
  where i.activity_id = ${activities}.id
)::int`;

/** Every touch recorded for a person, including the day they were met. */
export const contactInteractionCount = sql<number>`(
  select count(*) from ${interactions} as i
  where i.contact_id = ${contacts}.id
)::int`;

/** The day of a person's most recent touch. */
export const contactLastInteractionDate = sql<string | null>`(
  select i.interaction_date from ${interactions} as i
  where i.contact_id = ${contacts}.id
  order by i.interaction_date desc, i.id desc
  limit 1
)`;

/** What a person's most recent touch was. */
export const contactLastInteractionKind = sql<InteractionKind | null>`(
  select i.kind from ${interactions} as i
  where i.contact_id = ${contacts}.id
  order by i.interaction_date desc, i.id desc
  limit 1
)`;

/** The member's location group, from their first enrolment. */
export const activityMemberUnitName = sql<string | null>`(
  select u.name from ${schema.sogpEnrollments} as e
  inner join ${schema.unitMembers} as um on um.enrollment_id = e.id
  inner join ${schema.units} as u on u.id = um.unit_id
  where e.user_id = ${activities}.user_id
  order by e.created_at
  limit 1
)`;
