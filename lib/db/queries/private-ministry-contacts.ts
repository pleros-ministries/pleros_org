import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { normalisePrivateContact, type MinistryContact } from "@/lib/community/reporting-v3";
import { inputRecord, parseReportContacts, reportId, reportRequestKey } from "@/lib/community/reporting-v3-input";
import { reportingV3SchemaReady, requireReportingV3, requireReportingV3Reads } from "./reporting-v3-gate";
import type { Tx } from "./outreach-contacts";

export async function createPrivateMinistryContact(userId: string, value: unknown): Promise<MinistryContact> {
  requireReportingV3();
  const input = inputRecord(value), requestKey = reportRequestKey(input.requestKey);
  const parsed = normalisePrivateContact(input);
  if (!parsed.ok) throw new CommunityError(parsed.error);
  return transactionDb.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`private-contact:${userId}:${requestKey}`}, 0))`);
    const [existing] = await tx.select().from(s.privateMinistryContacts).where(and(eq(s.privateMinistryContacts.userId, userId), eq(s.privateMinistryContacts.requestKey, requestKey)));
    if (existing) {
      if (Object.entries(parsed.value).some(([key, val]) => existing[key as keyof typeof parsed.value] !== val)) throw new CommunityError("That contact was saved with different details. Reload before changing it.");
      return { key: `private:${existing.id}`, name: existing.name, phone: existing.phone, email: existing.email, note: existing.note };
    }
    const [row] = await tx.insert(s.privateMinistryContacts).values({ userId, requestKey, ...parsed.value }).returning();
    return { key: `private:${row.id}`, ...parsed.value };
  });
}

/** No staff/admin bypass: the owner identity comes from the server session. */
export async function listPrivateMinistryContacts(userId: string): Promise<MinistryContact[]> {
  if (!reportingV3SchemaReady()) return [];
  const rows = await db.select({ id: s.privateMinistryContacts.id, name: s.privateMinistryContacts.name, phone: s.privateMinistryContacts.phone, email: s.privateMinistryContacts.email, note: s.privateMinistryContacts.note }).from(s.privateMinistryContacts).where(eq(s.privateMinistryContacts.userId, userId)).orderBy(s.privateMinistryContacts.name).limit(1000);
  return rows.map(({ id, ...row }) => ({ key: `private:${id}`, ...row }));
}

export async function listReportContactChoices(userId: string): Promise<MinistryContact[]> {
  if (!reportingV3SchemaReady()) return [];
  const [privateContacts, legacy] = await Promise.all([
    listPrivateMinistryContacts(userId),
    db.select({ id: s.outreachContacts.id, name: s.outreachContacts.name, phone: s.outreachContacts.phone, note: s.outreachContacts.note }).from(s.outreachContacts).where(eq(s.outreachContacts.userId, userId)).orderBy(s.outreachContacts.name).limit(1000),
  ]);
  return [...privateContacts, ...legacy.map(({ id, ...row }) => ({ key: `legacy:${id}`, ...row, email: null }))];
}

/** Check ownership again in the report transaction; never trust client labels/phones. */
export async function requireOwnedReportContacts(tx: Tx, userId: string, input: unknown) {
  const keys = parseReportContacts(input);
  const privateIds = keys.filter(key => key.startsWith("private:")).map(key => Number(key.split(":")[1]));
  const legacyIds = keys.filter(key => key.startsWith("legacy:")).map(key => Number(key.split(":")[1]));
  const privateRows = privateIds.length ? await tx.select({ id: s.privateMinistryContacts.id }).from(s.privateMinistryContacts).where(and(eq(s.privateMinistryContacts.userId, userId), inArray(s.privateMinistryContacts.id, privateIds))) : [];
  const legacyRows = legacyIds.length ? await tx.select({ id: s.outreachContacts.id }).from(s.outreachContacts).where(and(eq(s.outreachContacts.userId, userId), inArray(s.outreachContacts.id, legacyIds))) : [];
  if (privateRows.length !== privateIds.length || legacyRows.length !== legacyIds.length) throw new CommunityError("One of those contacts is not on your list.");
  return keys.map(key => ({ privateContactId: key.startsWith("private:") ? Number(key.split(":")[1]) : null, legacyContactId: key.startsWith("legacy:") ? Number(key.split(":")[1]) : null }));
}

export async function getPrivateMinistryContact(userId: string, id: number) {
  requireReportingV3Reads(); reportId(id);
  const [contact] = await db.select().from(s.privateMinistryContacts).where(and(eq(s.privateMinistryContacts.id, id), eq(s.privateMinistryContacts.userId, userId)));
  if (!contact) throw new CommunityError("That contact is not on your list.");
  const history = await db.select({ activityId: s.ministryActivities.id, date: s.ministryActivities.activityDate, kind: s.ministryActivities.kind }).from(s.ministryReportContacts).innerJoin(s.ministryActivities, eq(s.ministryActivities.id, s.ministryReportContacts.activityId)).where(and(eq(s.ministryReportContacts.privateContactId, id), eq(s.ministryActivities.userId, userId))).orderBy(s.ministryActivities.activityDate).limit(200);
  return { contact: { ...contact, createdAt: contact.createdAt.toISOString() }, history };
}
