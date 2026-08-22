import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  buildWelcomeLeadUpsertValues,
  serializeWelcomeLeadSummary,
} from "@/lib/welcome-pack-leads";
import { normalizeEmail } from "@/lib/welcome-flow";

import * as schema from "../schema";

export async function upsertWelcomePackLead(input: {
  email: string;
  name?: string | null;
  source?: string | null;
}) {
  const values = buildWelcomeLeadUpsertValues(input);
  const now = new Date();

  const [insertedLead] = await db
    .insert(schema.welcomePackLeads)
    .values(values)
    .onConflictDoNothing({
      target: schema.welcomePackLeads.email,
    })
    .returning();

  if (insertedLead) {
    return { lead: insertedLead, created: true };
  }

  const [lead] = await db
    .update(schema.welcomePackLeads)
    .set({
      name: values.name,
      source: values.source,
      mainAccessGranted: true,
      updatedAt: now,
    })
    .where(eq(schema.welcomePackLeads.email, values.email))
    .returning();

  return { lead, created: false };
}

export async function getWelcomePackLeadByEmail(email: string) {
  return (
    (await db.query.welcomePackLeads.findFirst({
      where: (lead, { eq: eq2 }) => eq2(lead.email, normalizeEmail(email)),
    })) ?? null
  );
}

export async function confirmWelcomePackShare(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  const [lead] = await db
    .insert(schema.welcomePackLeads)
    .values({
      email: normalizedEmail,
      source: "welcome",
      mainAccessGranted: true,
      extraGiftsUnlocked: true,
      sharedConfirmedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.welcomePackLeads.email,
      set: {
        mainAccessGranted: true,
        extraGiftsUnlocked: true,
        sharedConfirmedAt: now,
        updatedAt: now,
      },
    })
    .returning();

  return lead;
}

export async function getWelcomePackLeadSummaries() {
  const leads = await db
    .select()
    .from(schema.welcomePackLeads)
    .orderBy(desc(schema.welcomePackLeads.createdAt));

  return leads.map(serializeWelcomeLeadSummary);
}

export async function updateWelcomePackLeadSource(email: string, source: string) {
  const [lead] = await db
    .update(schema.welcomePackLeads)
    .set({
      source,
      updatedAt: new Date(),
    })
    .where(eq(schema.welcomePackLeads.email, normalizeEmail(email)))
    .returning();

  return lead ?? null;
}
