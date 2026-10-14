import "server-only";
import { eq, sql } from "drizzle-orm";
import { transactionDb } from "./transaction";
import { sogpLearningPreferences } from "./schema";
export type LearningTx = Parameters<Parameters<typeof transactionDb.transaction>[0]>[0];

/** Also used by legacy listen/undo writers after the schema-installed gate. */
export async function withSogpLearningLock<T>(userId: string, operation: (tx: LearningTx) => Promise<T>): Promise<T> {
  return transactionDb.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'pleros:sogp-learning:' + userId}, 0))`);
    return operation(tx);
  });
}
export async function bumpSogpLearningRevision(tx: LearningTx, userId: string) {
  await tx.update(sogpLearningPreferences).set({ revision: sql`${sogpLearningPreferences.revision} + 1`, updatedAt: sql`now()` }).where(eq(sogpLearningPreferences.userId,userId));
}
