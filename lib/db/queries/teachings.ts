import { asc, desc, eq, min, sql } from "drizzle-orm";

import { db } from "../index";
import { teachings } from "../schema";

export type Teaching = typeof teachings.$inferSelect;
export type NewTeaching = typeof teachings.$inferInsert;

export async function getAllTeachings(): Promise<Teaching[]> {
  return db.select().from(teachings).orderBy(asc(teachings.sn));
}

/** Each series with its number of teachings, in library order, for the dashboard Library. */
export async function getTeachingSeriesCounts(): Promise<Array<{ series: string; count: number }>> {
  return db.select({ series: teachings.series, count: sql<number>`count(*)::int` })
    .from(teachings)
    .groupBy(teachings.series)
    .orderBy(min(teachings.sn));
}

export async function getTeachingById(id: number): Promise<Teaching | undefined> {
  const rows = await db.select().from(teachings).where(eq(teachings.id, id));
  return rows[0];
}

export async function getNextSn(): Promise<number> {
  const rows = await db
    .select({ sn: teachings.sn })
    .from(teachings)
    .orderBy(desc(teachings.sn))
    .limit(1);
  return rows.length > 0 ? rows[0].sn + 1 : 1;
}

export async function createTeaching(data: NewTeaching): Promise<Teaching> {
  const rows = await db.insert(teachings).values(data).returning();
  return rows[0];
}

export async function deleteTeaching(id: number): Promise<Teaching | undefined> {
  const rows = await db.delete(teachings).where(eq(teachings.id, id)).returning();
  return rows[0];
}

export async function updateTeaching(
  id: number,
  data: Partial<Pick<Teaching, "title" | "series" | "date" | "audioUrl" | "fileKey" | "duration" | "sn">>,
): Promise<Teaching | undefined> {
  const rows = await db
    .update(teachings)
    .set(data)
    .where(eq(teachings.id, id))
    .returning();
  return rows[0];
}
