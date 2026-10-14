import "server-only";
import { CommunityError } from "@/lib/community/errors";
export function sogpLearningSchemaReady() { return process.env.DASHBOARD_SOGP_LEARNING_V3_SCHEMA === "1"; }
export function sogpLearningWritesEnabled() { return sogpLearningSchemaReady() && process.env.DASHBOARD_SOGP_LEARNING_V3 === "1"; }
export function requireSogpLearningWrites() {
  if (!sogpLearningWritesEnabled()) throw new CommunityError("The new learning settings are not enabled yet.");
}
