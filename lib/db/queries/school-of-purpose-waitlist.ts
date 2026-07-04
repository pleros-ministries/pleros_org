import { desc } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";

export async function upsertSchoolOfPurposeWaitlistEntry(input: {
  name: string;
  phone: string;
  email: string;
}) {
  const now = new Date();

  const [entry] = await db
    .insert(schema.schoolOfPurposeWaitlist)
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.schoolOfPurposeWaitlist.email,
      set: {
        name: input.name,
        phone: input.phone,
        updatedAt: now,
      },
    })
    .returning();

  return entry;
}

export async function getSchoolOfPurposeWaitlistEntryByEmail(email: string) {
  return (
    (await db.query.schoolOfPurposeWaitlist.findFirst({
      where: (entry, { eq: eq2 }) => eq2(entry.email, email),
    })) ?? null
  );
}

export async function getSchoolOfPurposeWaitlistEntries() {
  return db
    .select()
    .from(schema.schoolOfPurposeWaitlist)
    .orderBy(desc(schema.schoolOfPurposeWaitlist.createdAt));
}

