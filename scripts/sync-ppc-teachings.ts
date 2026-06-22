import { readFileSync } from "node:fs";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq, inArray, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";
import {
  buildPpcLessonAudioUpdates,
  getPpcLessonReleaseStatusUpdates,
  type PpcTeachingManifestEntry,
} from "@/lib/ppc-teaching-sync";

config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const RELEASE_SCOPE: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5],
  2: [1, 2],
};

function readManifest(path: string): PpcTeachingManifestEntry[] {
  return JSON.parse(readFileSync(path, "utf8")) as PpcTeachingManifestEntry[];
}

async function syncLevel(levelId: number, manifestPath: string) {
  const manifest = readManifest(manifestPath);
  const lessons = await db
    .select({
      id: schema.lessons.id,
      lessonNumber: schema.lessons.lessonNumber,
      title: schema.lessons.title,
    })
    .from(schema.lessons)
    .where(eq(schema.lessons.levelId, levelId))
    .orderBy(asc(schema.lessons.lessonNumber));

  const updates = buildPpcLessonAudioUpdates(manifest, lessons);

  for (const update of updates) {
    await db
      .update(schema.lessons)
      .set({
        audioUrl: update.audioUrl,
        audioUploadKey: update.audioUploadKey,
        audioFileName: update.audioFileName,
        audioFileSize: update.audioFileSize,
        audioUploadedAt: update.audioUploadedAt,
        updatedAt: new Date(),
      })
      .where(eq(schema.lessons.id, update.id));
  }

  return updates;
}

async function main() {
  const level1Updates = await syncLevel(1, "docs/level-1-ppc-teachings.json");
  const level2Updates = await syncLevel(2, "docs/level-2-ppc-teachings.json");

  const scopedLessons = await db
    .select({
      id: schema.lessons.id,
      levelId: schema.lessons.levelId,
      lessonNumber: schema.lessons.lessonNumber,
      status: schema.lessons.status,
    })
    .from(schema.lessons)
    .where(inArray(schema.lessons.levelId, [1, 2, 3]))
    .orderBy(asc(schema.lessons.levelId), asc(schema.lessons.lessonNumber));
  const statusUpdates = getPpcLessonReleaseStatusUpdates(
    scopedLessons,
    RELEASE_SCOPE,
  );

  for (const update of statusUpdates) {
    await db
      .update(schema.lessons)
      .set({
        status: update.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.lessons.id, update.id));
  }

  const refreshed = await db
    .select({
      id: schema.lessons.id,
      levelId: schema.lessons.levelId,
      lessonNumber: schema.lessons.lessonNumber,
      title: schema.lessons.title,
      audioUrl: schema.lessons.audioUrl,
      audioUploadKey: schema.lessons.audioUploadKey,
      audioFileName: schema.lessons.audioFileName,
    })
    .from(schema.lessons)
    .where(inArray(schema.lessons.levelId, [1, 2]))
    .orderBy(asc(schema.lessons.levelId), asc(schema.lessons.lessonNumber));

  console.log(
    JSON.stringify(
      {
        synced: {
          level1: level1Updates.length,
          level2: level2Updates.length,
        },
        releaseScope: {
          published: RELEASE_SCOPE,
          statusUpdates: statusUpdates.length,
        },
        lessons: refreshed,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
