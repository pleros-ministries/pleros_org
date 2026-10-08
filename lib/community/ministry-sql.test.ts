import { eq } from "drizzle-orm";
import { QueryBuilder } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";

import {
  activityMemberUnitName,
  activityPeopleCount,
  contactInteractionCount,
  contactLastInteractionDate,
  contactLastInteractionKind,
} from "../db/queries/ministry-sql";
import { ministryActivities, outreachContacts, users } from "../db/schema";

/** Prints a query without a database, with whitespace collapsed. */
function printed(query: { toSQL: () => { sql: string } }): string {
  return query.toSQL().sql.replace(/\s+/g, " ");
}

const builder = () => new QueryBuilder();

describe("ministry sub-selects", () => {
  test("count an activity's people against the outer activity, even with no join", () => {
    const text = printed(
      builder()
        .select({ id: ministryActivities.id, people: activityPeopleCount })
        .from(ministryActivities),
    );
    expect(text).toContain(
      'from "outreach_contact_interactions" as i where i.activity_id = "ministry_activities".id',
    );
    // The bare form compared an interaction with itself.
    expect(text).not.toContain('"activity_id" = "id"');
  });

  test("still name the outer activity when the query joins another table", () => {
    const text = printed(
      builder()
        .select({ id: ministryActivities.id, people: activityPeopleCount })
        .from(ministryActivities)
        .innerJoin(users, eq(users.id, ministryActivities.userId)),
    );
    expect(text).toContain('i.activity_id = "ministry_activities".id');
  });

  test("read a person's history against the outer person", () => {
    const text = printed(
      builder()
        .select({
          id: outreachContacts.id,
          count: contactInteractionCount,
          lastDate: contactLastInteractionDate,
          lastKind: contactLastInteractionKind,
        })
        .from(outreachContacts),
    );
    expect(text.match(/i\.contact_id = "outreach_contacts"\.id/g)).toHaveLength(3);
    expect(text).toContain("select i.interaction_date from");
    expect(text).toContain("select i.kind from");
    expect(text).toContain("order by i.interaction_date desc, i.id desc limit 1");
    expect(text).not.toContain('"contact_id" = "id"');
  });

  test("find a member's group from their first enrolment", () => {
    const text = printed(
      builder()
        .select({ id: ministryActivities.id, unitName: activityMemberUnitName })
        .from(ministryActivities),
    );
    expect(text).toContain('where e.user_id = "ministry_activities".user_id');
    expect(text).toContain("order by e.created_at limit 1");
  });
});
