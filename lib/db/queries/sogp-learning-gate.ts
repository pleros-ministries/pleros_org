import "server-only";
import { CommunityError } from "@/lib/community/errors";
// Migration 0055 is installed on the confirmed shared target. The completed
// flow is live by default, not restricted to a database fingerprint. Other
// databases must install the migration before deploying this revision.
export function sogpLearningSchemaReady() { return process.env.DASHBOARD_SOGP_LEARNING_V3_SCHEMA !== "0"; }
// Explicit rollback: set DASHBOARD_SOGP_LEARNING_V3=0. Leave the schema guard
// on after migration so legacy listen writers retain their concurrency lock.
export function sogpLearningWritesEnabled() { return sogpLearningSchemaReady() && process.env.DASHBOARD_SOGP_LEARNING_V3 !== "0"; }
export function requireSogpLearningWrites() {
  if (!sogpLearningWritesEnabled()) throw new CommunityError("The new learning settings are not enabled yet.");
}
