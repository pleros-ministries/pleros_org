import type { Metadata } from "next";
import { inArray } from "drizzle-orm";
import { Suspense } from "react";

import { SogpDistributionView, type DistributionGroup } from "@/components/admin/sogp-distribution-view";
import { dashboardHeadingFont } from "@/components/dashboard/v3/font";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  distributionAssignments,
  distributionLeaders,
} from "@/lib/sogp/discipleship-distribution-draft";

// Open link, no sign-in (user decision, 17 November). Names are read live by id.
export const instant = false;
export const metadata: Metadata = {
  title: "SOGP group distribution",
  robots: { index: false, follow: false },
};

async function loadGroups(): Promise<DistributionGroup[]> {
  const ids = [
    ...new Set([
      ...distributionLeaders.map((l) => l.enrollmentId),
      ...distributionAssignments.flatMap(([enrolee, leader]) => [enrolee, leader]),
    ]),
  ];
  const rows = await db
    .select({
      id: schema.sogpEnrollments.id,
      name: schema.sogpEnrollments.name,
      region: schema.sogpEnrollments.region,
      birthYear: schema.sogpEnrollments.birthYear,
      whatsappConsent: schema.sogpEnrollments.whatsappConsent,
    })
    .from(schema.sogpEnrollments)
    .where(inArray(schema.sogpEnrollments.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));

  return distributionLeaders.flatMap((leader) => {
    const person = byId.get(leader.enrollmentId);
    if (!person) return [];
    const enrolees = distributionAssignments
      .filter(([, leaderId]) => leaderId === leader.enrollmentId)
      .flatMap(([enroleeId, , ...notes]) => {
        const e = byId.get(enroleeId);
        return e
          ? [{
              id: e.id,
              name: e.name.trim(),
              region: e.region.trim(),
              birthYear: e.birthYear,
              whatsappConsent: e.whatsappConsent,
              notes,
            }]
          : [];
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return [{
      id: leader.enrollmentId,
      name: person.name.trim(),
      role: leader.role,
      location: leader.location,
      enrolees,
    }];
  });
}

async function Distribution() {
  return <SogpDistributionView groups={await loadGroups()} />;
}

export default function SogpDistributionPage() {
  return (
    <div className={dashboardHeadingFont.variable}>
      <Suspense fallback={<p style={{ padding: 16 }}>Loading…</p>}>
        <Distribution />
      </Suspense>
    </div>
  );
}
