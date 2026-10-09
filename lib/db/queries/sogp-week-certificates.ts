import { randomBytes } from "node:crypto";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { notifySogpWeekCertificates } from "@/lib/community/notify";
import { sendSogpWeekCertificateEmail } from "@/lib/email/send";
import { getSogpLevel } from "@/lib/sogp/curriculum";
import { buildReferralUrl } from "@/lib/sogp/referral";
import {
  buildSogpWeekVerificationCode,
  isSogpWeekNumber,
  selectWeeksToAward,
  type SogpWeekNumber,
} from "@/lib/sogp/week-certificates";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";
import * as schema from "../schema";
import {
  getActiveSogpJourneyWithContext,
  type SogpJourneyContext,
  type SogpJourneyData,
} from "./sogp-journey";

export const SOGP_CERTIFICATES_PATH = "/dashboard/sogp/certificate";

export type AwardedSogpWeekCertificate = {
  week: SogpWeekNumber;
  verificationCode: string;
  issuedAt: Date;
};

type LoadedJourney = { journey: SogpJourneyData; context: SogpJourneyContext };

/**
 * Issues a certificate for every week this learner has newly completed in
 * their current cohort. The insert is the claim: only the request whose rows
 * come back sends notices, so racing checks never notify twice. Costs no
 * query when nothing is due.
 */
export async function awardSogpWeekCertificates(
  loaded: LoadedJourney,
): Promise<{ journey: SogpJourneyData; awarded: AwardedSogpWeekCertificate[] }> {
  const { journey, context } = loaded;
  const due = selectWeeksToAward({
    summaries: journey.certificates.weeks,
    existingWeeks: context.existingWeeks,
    enrollmentStatus: context.enrollmentStatus,
  });
  if (due.length === 0) return { journey, awarded: [] };

  const inserted = await db
    .insert(schema.sogpWeekCertificates)
    .values(
      due.map((week) => ({
        enrollmentId: context.enrollmentId,
        cohortId: context.cohortId,
        week,
        verificationCode: buildSogpWeekVerificationCode(
          week,
          randomBytes(6).toString("hex"),
        ),
      })),
    )
    .onConflictDoNothing({
      target: [
        schema.sogpWeekCertificates.enrollmentId,
        schema.sogpWeekCertificates.cohortId,
        schema.sogpWeekCertificates.week,
      ],
    })
    .returning();

  // Another request may have issued some of these first: read them back so
  // this response still shows every certificate.
  const rows =
    inserted.length === due.length
      ? inserted
      : await db
          .select()
          .from(schema.sogpWeekCertificates)
          .where(
            and(
              eq(schema.sogpWeekCertificates.enrollmentId, context.enrollmentId),
              eq(schema.sogpWeekCertificates.cohortId, context.cohortId),
              inArray(schema.sogpWeekCertificates.week, due),
            ),
          );
  const byWeek = new Map(rows.map((row) => [row.week, row]));
  for (const row of rows) context.existingWeeks.add(row.week);

  return {
    journey: {
      ...journey,
      certificates: {
        ...journey.certificates,
        weeks: journey.certificates.weeks.map((week) => {
          const row = byWeek.get(week.week);
          return row && !row.revokedAt
            ? {
                ...week,
                certificate: {
                  verificationCode: row.verificationCode,
                  issuedAt: row.issuedAt.toISOString(),
                },
              }
            : week;
        }),
      },
    },
    awarded: inserted.flatMap((row) =>
      isSogpWeekNumber(row.week)
        ? [{ week: row.week, verificationCode: row.verificationCode, issuedAt: row.issuedAt }]
        : [],
    ),
  };
}

/**
 * One in-app notification, push and email for everything just awarded. A
 * failure is logged and never undoes the award.
 */
export async function sendSogpWeekCertificateNotices(
  context: SogpJourneyContext,
  awarded: AwardedSogpWeekCertificate[],
) {
  if (awarded.length === 0) return;
  const weeks = awarded.map((item) => item.week).sort((a, b) => a - b);
  const results = await Promise.allSettled([
    notifySogpWeekCertificates({ userId: context.userId, weeks }),
    sendSogpWeekCertificateEmail({
      to: context.email,
      firstName: context.firstName,
      weeks: weeks.map((week) => ({ week, title: getSogpLevel(week).title })),
      url: `${resolvePublicSiteUrl(process.env)}${SOGP_CERTIFICATES_PATH}`,
    }),
  ]);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("SOGP week certificate notice failed:", result.reason);
    }
  }
}

/** Loads the learner's journey, awards anything due and, by default, sends notices. */
export async function checkAndAwardSogpWeekCertificates(
  userId: string,
  options: { notify?: boolean; now?: Date } = {},
) {
  const loaded = await getActiveSogpJourneyWithContext(userId, options.now);
  if (!loaded) return [];
  const { awarded } = await awardSogpWeekCertificates(loaded);
  if (options.notify !== false) {
    await sendSogpWeekCertificateNotices(loaded.context, awarded);
  }
  return awarded;
}

/** A week certificate its owner may download; null when missing, revoked or someone else's. */
export async function getSogpWeekCertificateForOwner(
  verificationCode: string,
  userId: string,
) {
  const [row] = await db
    .select({
      certificate: schema.sogpWeekCertificates,
      enrollment: {
        userId: schema.sogpEnrollments.userId,
        name: schema.sogpEnrollments.name,
      },
      // The cohort the week was earned in, which a cohort move can leave
      // different from the enrolment's current cohort.
      cohort: { title: schema.sogpCohorts.title },
    })
    .from(schema.sogpWeekCertificates)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpWeekCertificates.enrollmentId, schema.sogpEnrollments.id),
    )
    .innerJoin(
      schema.sogpCohorts,
      eq(schema.sogpWeekCertificates.cohortId, schema.sogpCohorts.id),
    )
    .where(
      and(
        eq(schema.sogpWeekCertificates.verificationCode, verificationCode),
        isNull(schema.sogpWeekCertificates.revokedAt),
      ),
    )
    .limit(1);
  if (!row || row.enrollment.userId !== userId) return null;
  const week = row.certificate.week;
  if (!isSogpWeekNumber(week)) return null;
  return { ...row, week };
}

/** Every live week and final certificate across all of a learner's enrolments. */
export async function listSogpCertificatesForUser(userId: string) {
  const [weeks, finals] = await Promise.all([
    db
      .select({
        cohortId: schema.sogpWeekCertificates.cohortId,
        cohortTitle: schema.sogpCohorts.title,
        week: schema.sogpWeekCertificates.week,
        verificationCode: schema.sogpWeekCertificates.verificationCode,
        issuedAt: schema.sogpWeekCertificates.issuedAt,
      })
      .from(schema.sogpWeekCertificates)
      .innerJoin(
        schema.sogpEnrollments,
        eq(schema.sogpWeekCertificates.enrollmentId, schema.sogpEnrollments.id),
      )
      .innerJoin(
        schema.sogpCohorts,
        eq(schema.sogpWeekCertificates.cohortId, schema.sogpCohorts.id),
      )
      .where(
        and(
          eq(schema.sogpEnrollments.userId, userId),
          isNull(schema.sogpWeekCertificates.revokedAt),
        ),
      )
      .orderBy(desc(schema.sogpCohorts.startsAt), asc(schema.sogpWeekCertificates.week)),
    db
      .select({
        cohortId: schema.sogpCohorts.id,
        cohortTitle: schema.sogpCohorts.title,
        verificationCode: schema.sogpCertificates.verificationCode,
        issuedAt: schema.sogpCertificates.issuedAt,
      })
      .from(schema.sogpCertificates)
      .innerJoin(
        schema.sogpEnrollments,
        eq(schema.sogpCertificates.enrollmentId, schema.sogpEnrollments.id),
      )
      .innerJoin(
        schema.sogpCohorts,
        eq(schema.sogpEnrollments.cohortId, schema.sogpCohorts.id),
      )
      .where(
        and(
          eq(schema.sogpEnrollments.userId, userId),
          isNull(schema.sogpCertificates.revokedAt),
        ),
      )
      .orderBy(desc(schema.sogpCertificates.issuedAt)),
  ]);
  return { weeks, finals };
}

/**
 * Admin: one enrolment's week certificates in its current cohort, revoked
 * ones included.
 */
export async function listSogpWeekCertificatesForEnrollment(enrollmentId: number) {
  return db
    .select({
      week: schema.sogpWeekCertificates.week,
      verificationCode: schema.sogpWeekCertificates.verificationCode,
      issuedAt: schema.sogpWeekCertificates.issuedAt,
      revokedAt: schema.sogpWeekCertificates.revokedAt,
    })
    .from(schema.sogpWeekCertificates)
    .innerJoin(
      schema.sogpEnrollments,
      and(
        eq(schema.sogpWeekCertificates.enrollmentId, schema.sogpEnrollments.id),
        eq(schema.sogpWeekCertificates.cohortId, schema.sogpEnrollments.cohortId),
      ),
    )
    .where(eq(schema.sogpWeekCertificates.enrollmentId, enrollmentId))
    .orderBy(asc(schema.sogpWeekCertificates.week));
}

/**
 * Where a shared certificate points: the learner's referral link when they
 * already have one, otherwise the public SOGP page. Reads only, so a page
 * render never mints a referral code.
 */
export async function getSogpCertificateShareUrl(enrollmentId: number) {
  const [row] = await db
    .select({ referralCode: schema.sogpEnrollments.referralCode })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.id, enrollmentId))
    .limit(1);
  const siteUrl = resolvePublicSiteUrl(process.env);
  return row?.referralCode
    ? buildReferralUrl(siteUrl, row.referralCode)
    : `${siteUrl.replace(/\/$/, "")}/sogp`;
}
